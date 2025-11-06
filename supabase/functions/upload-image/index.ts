import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UploadRequest {
  file: string; // Base64 encoded file
  fileName: string;
  contentType: string;
  userId?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Verify user with admin client
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Parse request body
    const { file, fileName, contentType }: UploadRequest = await req.json()

    if (!file || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing file or fileName' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Validate file type
    if (contentType && !contentType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: 'File must be an image' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Generate unique storage path
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = fileName.split('.').pop() || 'jpg'
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `images/${user.id}/${timestamp}-${randomString}-${sanitizedFileName}`

    // Convert base64 to binary
    const base64Data = file.includes(',') ? file.split(',')[1] : file
    let binaryData: Uint8Array
    
    try {
      binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid base64 data' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (binaryData.length > maxSize) {
      return new Response(
        JSON.stringify({ error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Upload to Supabase Storage using admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(storagePath, binaryData, {
        contentType: contentType || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ 
          error: uploadError.message || 'Failed to upload to storage',
          details: uploadError
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(storagePath)

    // Generate UUID
    const imageUuid = crypto.randomUUID()

    // Insert into database using admin client
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('image_obj_storage_table')
      .insert({
        image_uuid: imageUuid,
        image_obj: storagePath,
        image_access_url: urlData.publicUrl,
        image_create_datetime: new Date().toISOString(),
        file_name: fileName,
        file_size: binaryData.length,
        mime_type: contentType || 'image/jpeg',
        user_id: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Try to clean up storage if database insert fails
      await supabaseAdmin.storage.from('images').remove([storagePath])
      
      return new Response(
        JSON.stringify({ 
          error: dbError.message || 'Failed to save image metadata',
          details: dbError
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Return response in requested format: { Image_UUID, Image_AccessURL }
    return new Response(
      JSON.stringify({
        Image_UUID: imageUuid,
        Image_AccessURL: urlData.publicUrl,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )

  } catch (error: any) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Upload failed',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})

