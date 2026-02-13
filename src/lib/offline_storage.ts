import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'

export async function isOnline(): Promise<boolean> {
  const s = await NetInfo.fetch()
  return !!s.isConnected
}

export async function cacheSet(key: string, data: any) {
  try { await AsyncStorage.setItem(`cache:${key}`, JSON.stringify({ t: Date.now(), d: data })) } catch {}
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`cache:${key}`)
    if (!raw) return null
    const obj = JSON.parse(raw)
    return obj.d as T
  } catch { return null }
}

type QueueItem = { type: 'post' | 'message'; payload: any }

export async function enqueue(item: QueueItem) {
  const raw = await AsyncStorage.getItem('queue')
  const arr = raw ? JSON.parse(raw) : []
  arr.push(item)
  await AsyncStorage.setItem('queue', JSON.stringify(arr))
}

export async function flush(processors: { post: (p: any) => Promise<void>; message: (p: any) => Promise<void> }) {
  const online = await isOnline()
  if (!online) return
  const raw = await AsyncStorage.getItem('queue')
  const arr: QueueItem[] = raw ? JSON.parse(raw) : []
  const rest: QueueItem[] = []
  for (const it of arr) {
    try { await processors[it.type](it.payload) } catch { rest.push(it) }
  }
  await AsyncStorage.setItem('queue', JSON.stringify(rest))
}

