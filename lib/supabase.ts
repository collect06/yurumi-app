import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zmfgvbvmflyirumxwdpi.supabase.co'
const supabaseKey = 'sb_publishable_fZHptXmUj1snNKEpWOomDQ_NMXlm6Dw'

export const supabase = createClient(supabaseUrl, supabaseKey)