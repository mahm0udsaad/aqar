-- Create the new bucket for property videos
-- 'public' is set to TRUE, meaning files in this bucket will be publicly accessible via their URL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-videos', 'property-videos', TRUE)
ON CONFLICT (id) DO NOTHING; -- Prevents error if bucket already exists

-- Policy for authenticated users to upload any video MIME type to this bucket
-- This allows users who are logged in to upload video files.
CREATE POLICY "Allow authenticated video uploads to property-videos"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'property-videos' AND auth.role() = 'authenticated' AND (
    (metadata->>'mimetype') LIKE 'video/%' -- Corrected: Access mimetype from metadata JSONB
  )
);

-- Policy for public read access to videos in this bucket
-- This allows anyone to view the video files once they are uploaded.
CREATE POLICY "Allow public read access to property-videos"
ON storage.objects FOR SELECT USING (
  bucket_id = 'property-videos'
);

-- Optional: Policy to allow authenticated users to delete their own uploaded videos (if needed)
-- CREATE POLICY "Allow authenticated video deletions from property-videos"
-- ON storage.objects FOR DELETE USING (
--   bucket_id = 'property-videos' AND auth.uid() = owner -- Assuming 'owner' column stores the uploader's UID
-- );