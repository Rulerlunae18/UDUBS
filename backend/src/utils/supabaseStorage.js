import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function uploadToSupabase(localPath, fileName, mimeType) {
  const fileBuffer = fs.readFileSync(localPath)

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      upsert: true
    })

  if (error) throw error

  return supabase
    .storage
    .from('uploads')
    .getPublicUrl(fileName).data.publicUrl
}
