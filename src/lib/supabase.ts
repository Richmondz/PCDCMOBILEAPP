import Constants from 'expo-constants'
import { createClient } from '@supabase/supabase-js'

const url = Constants?.expoConfig?.extra?.SUPABASE_URL
const anon = Constants?.expoConfig?.extra?.SUPABASE_ANON_KEY

export const supabase = createClient(url || '', anon || '')

