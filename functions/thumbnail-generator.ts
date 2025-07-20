
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request: Request): Promise<Response> {
  const { record } = await request.json()

  if (!record) {
    return new Response('No record found in the request body', { status: 400 })
  }

  const { bucket, name } = record
  const filePath = name

  if (bucket !== 'property-images') {
    return new Response('This function only handles images from the property-images bucket', { status: 200 })
  }

  const { data: imageData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(filePath)

  if (downloadError) {
    console.error('Error downloading image:', downloadError)
    return new Response('Error downloading image', { status: 500 })
  }

  const resizedImage = await sharp(await imageData.arrayBuffer())
    .resize(400, 300)
    .toBuffer()

  const thumbnailPath = `thumbnail_${filePath.split('/').pop()}`

  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(thumbnailPath, resizedImage, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Error uploading thumbnail:', uploadError)
    return new Response('Error uploading thumbnail', { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('property-images')
    .getPublicUrl(thumbnailPath)

  const propertyId = filePath.split('/').pop()?.split('_')[0]

  if (propertyId) {
    const { error: updateError } = await supabase
      .from('properties')
      .update({ thumbnail_url: publicUrl })
      .eq('id', propertyId)

    if (updateError) {
      console.error('Error updating property thumbnail_url:', updateError)
      return new Response('Error updating property', { status: 500 })
    }
  }

  return new Response('Thumbnail generated and property updated successfully', { status: 200 })
}
