import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import * as Offline from '../lib/offline_storage'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'

// CONSTANTS
const ENABLE_BASE64_FALLBACK = false

export type Clip = { 
  id: string; 
  author_id: string; 
  title: string; 
  description?: string; 
  video_url: string; 
  created_at: string; 
  active_date?: string 
}

type ClipsState = {
  today: Clip[]
  bookmarks: Record<string, boolean>
  loadToday: () => Promise<void>
  bookmark: (clipId: string) => Promise<void>
  unbookmark: (clipId: string) => Promise<void>
  isBookmarked: (clipId: string) => boolean
  upload: (fileUri: string, title: string, description?: string, activeDate?: string) => Promise<{ ok: boolean, refreshed: boolean }>
}

/**
 * Helper to convert a file URI to a Blob reliably in React Native / Expo.
 * Tries fetch first, then XHR, then (optionally) FileSystem base64.
 */
async function uriToBlob(uri: string): Promise<Blob> {
  if (!uri || typeof uri !== 'string') {
    throw new Error(`Invalid URI: ${JSON.stringify(uri)}`)
  }

  if (__DEV__) {
    console.log(`[uriToBlob] Starting conversion for: ${uri.slice(0, 50)}...`)
  }

  // Strategy A: fetch()
  // Modern RN/Expo often supports this directly for local URIs
  try {
    if (__DEV__) console.log('[uriToBlob] Attempting Strategy A: fetch')
    const response = await fetch(uri)
    
    // Check status for http/https, but file:// might not have a status or be 0
    if (!response.ok && response.status !== 0) {
      throw new Error(`Fetch failed with status: ${response.status}`)
    }
    
    if (typeof response.blob !== 'function') {
      throw new Error('response.blob is not a function')
    }

    const blob = await response.blob()
    if (__DEV__) console.log(`[uriToBlob] Strategy A Success. Blob size: ${blob.size}, Type: ${blob.type}`)
    return blob
  } catch (err: any) {
    if (__DEV__) console.warn(`[uriToBlob] Strategy A failed: ${err.message}`)
  }

  // Strategy B: XMLHttpRequest (Classic RN fallback)
  try {
    if (__DEV__) console.log('[uriToBlob] Attempting Strategy B: XHR')
    const blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.onload = function () {
        // response is expected to be a Blob due to responseType
        if (xhr.response) {
          resolve(xhr.response as Blob)
        } else {
          reject(new Error('XHR completed but response is empty'))
        }
      }
      xhr.onerror = function () {
        reject(new Error(`XHR failed. Status: ${xhr.status}`))
      }
      xhr.responseType = 'blob'
      xhr.open('GET', uri, true)
      xhr.send(null)
    })
    
    if (__DEV__) console.log(`[uriToBlob] Strategy B Success. Blob size: ${blob.size}, Type: ${blob.type}`)
    return blob
  } catch (err: any) {
    if (__DEV__) console.warn(`[uriToBlob] Strategy B failed: ${err.message}`)
  }

  // Strategy C: FileSystem Base64 (Last Resort, Optional)
  if (ENABLE_BASE64_FALLBACK) {
    try {
      if (__DEV__) console.log('[uriToBlob] Attempting Strategy C: FileSystem Base64')
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
      const arrayBuffer = decode(base64)
      const blob = new Blob([arrayBuffer], { type: 'video/mp4' }) // Defaulting type since we read raw
      
      if (__DEV__) console.log(`[uriToBlob] Strategy C Success. Blob size: ${blob.size}`)
      return blob
    } catch (err: any) {
      if (__DEV__) console.warn(`[uriToBlob] Strategy C failed: ${err.message}`)
    }
  }

  throw new Error(`Failed to convert URI to Blob. All strategies failed for: ${uri.slice(0, 30)}...`)
}

export const useClips = create<ClipsState>((set, get) => ({
  today: [],
  bookmarks: {},

  loadToday: async () => {
    try {
      const today = new Date().toISOString().slice(0,10)
      let { data } = await supabase.from('clips').select('*').eq('active_date', today).order('created_at', { ascending: false }).limit(10)
      
      if (!data || !data.length) {
        // Fallback to latest if no active clips for today
        const res = await supabase.from('clips').select('*').order('created_at', { ascending: false }).limit(10)
        data = res.data || []
      }
      
      let list = (data as any[]) || []
      if (!list.length) {
        try {
          if (Offline.cacheGet) {
            const cached = await Offline.cacheGet<any[]>('clips:today')
            if (cached) list = cached
          }
        } catch (e) { console.error('Cache get error', e) }
      } else {
        try {
          if (Offline.cacheSet) {
            await Offline.cacheSet('clips:today', list)
          }
        } catch (e) { console.error('Cache set error', e) }
      }
      
      set({ today: list })
      
      // Load bookmarks if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: bms } = await supabase.from('clip_bookmarks').select('clip_id').eq('user_id', user.id)
        const map: Record<string, boolean> = {}
        (bms || []).forEach((b: any) => { map[b.clip_id] = true })
        set({ bookmarks: map })
      }
    } catch (err) {
      if (__DEV__) console.error('[loadToday] Error:', err)
    }
  },

  bookmark: async (clipId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('clip_bookmarks').insert({ clip_id: clipId, user_id: user.id })
    set(state => ({ bookmarks: { ...state.bookmarks, [clipId]: true } }))
  },

  unbookmark: async (clipId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('clip_bookmarks').delete().eq('clip_id', clipId).eq('user_id', user.id)
    set(state => { const b = { ...state.bookmarks }; delete b[clipId]; return { bookmarks: b } })
  },

  isBookmarked: (clipId) => !!get().bookmarks[clipId],

  upload: async (fileUri, title, description, activeDate) => {
    if (__DEV__) console.log('[upload] Starting upload for:', fileUri)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    try {
      // 1. Convert URI to Blob
      const blob = await uriToBlob(fileUri)
      
      // 2. Generate Path
      const fileExt = fileUri.split('.').pop() || 'mp4'
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`
      const path = `${user.id}/${fileName}`
      
      if (__DEV__) console.log(`[upload] Uploading to path: ${path}, Blob size: ${blob.size}, Type: ${blob.type}`)

      // 3. Upload to Supabase
      const { data, error } = await supabase.storage.from('clips').upload(path, blob, { 
        contentType: blob.type || 'video/mp4', 
        upsert: false,
        cacheControl: '3600'
      })
      
      if (error) {
        if (__DEV__) console.error('[upload] Supabase Storage Error:', error)
        throw error
      }

      if (__DEV__) console.log('[upload] Storage upload success:', data)

      // 4. Get Public URL
      const { data: urlData } = supabase.storage.from('clips').getPublicUrl(path)
      const publicUrl = urlData.publicUrl
      
      if (__DEV__) console.log('[upload] Public URL generated:', publicUrl)

      // 5. Insert Metadata Record
      const { error: dbError } = await supabase.from('clips').insert({ 
        author_id: user.id, 
        title, 
        description, 
        video_url: publicUrl, 
        active_date: activeDate 
      })

      if (dbError) {
        if (__DEV__) console.error('[upload] DB Insert Error:', dbError)
        throw dbError
      }

      if (__DEV__) console.log('[upload] DB record created successfully')

      // 6. Refresh List
      let refreshed = false
      try {
        const loadTodayFn = get().loadToday
        if (typeof loadTodayFn === 'function') {
           await loadTodayFn()
           refreshed = true
        } else {
           if (__DEV__) console.warn('[upload] loadToday is not a function:', typeof loadTodayFn)
        }
      } catch (refreshErr) {
        if (__DEV__) console.error('[upload] Refresh failed:', refreshErr)
      }
      
      return { ok: true, refreshed }

    } catch (err: any) {
      if (__DEV__) console.error('[upload] Critical failure:', err)
      throw new Error(`Upload failed: ${err.message || 'Unknown error'}`)
    }
  }
}))
