import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[]; // Assuming 'files' is the name of the input

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
    }

    const uploadedFileUrls: string[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('property_images') // Assuming you have a bucket named 'property_images'
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return NextResponse.json({ error: `Failed to upload file: ${file.name}` }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from('property_images')
        .getPublicUrl(fileName);

      if (publicUrlData) {
        uploadedFileUrls.push(publicUrlData.publicUrl);
      }
    }

    return NextResponse.json({ urls: uploadedFileUrls }, { status: 200 });

  } catch (error) {
    console.error('API upload error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
