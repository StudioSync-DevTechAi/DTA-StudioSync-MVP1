import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UploadRequest {
  file: string; // Base64 encoded PDF
  fileName: string;
  projectUuid: string;
  userId?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Supabase client with service role key for admin operations (bypasses RLS)
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
        JSON.stringify({ error: 'Unauthorized. Please log in to upload PDFs.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Parse request body
    const { file, fileName, projectUuid }: UploadRequest = await req.json()

    if (!file || !fileName || !projectUuid) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, fileName, or projectUuid' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Validate file type (should be PDF)
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return new Response(
        JSON.stringify({ error: 'File must be a PDF' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Generate unique storage path: {user_id}/{project_uuid}/{timestamp}-{random}-quotation.pdf
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${user.id}/${projectUuid}/${timestamp}-${randomString}-${sanitizedFileName}`

    console.log('Uploading PDF:', { userId: user.id, projectUuid, storagePath })

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

    // Validate file size (100MB limit for PDFs)
    const maxSize = 100 * 1024 * 1024
    if (binaryData.length > maxSize) {
      return new Response(
        JSON.stringify({ error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, binaryData, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: uploadError.message || 'Failed to upload to storage',
          details: uploadError
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    console.log('PDF uploaded successfully:', uploadData)

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(storagePath)

    if (!urlData || !urlData.publicUrl) {
      // Try to clean up storage if URL retrieval fails
      await supabaseAdmin.storage.from('documents').remove([storagePath])
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to retrieve public URL for uploaded PDF'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Return success response with URL
    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.publicUrl,
        path: storagePath,
        size: binaryData.length
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
        success: false,
        error: error.message || 'Internal server error',
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

