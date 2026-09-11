/*
# Create avatars storage bucket and policies

1. Storage
- Create a public bucket named `avatars` for storing user profile pictures.

2. Security (Storage Policies)
- Authenticated users can upload, read, update, and delete their own avatar files.
- Files are stored under a path prefixed with the user's ID for ownership isolation.
- Public read access for avatar display.

3. Notes
- The bucket is public so avatar URLs can be displayed without signed URLs.
- Upload paths follow the pattern: `<user_id>/avatar-<timestamp>.<ext>`
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "avatar_upload_own" ON storage.objects;
CREATE POLICY "avatar_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read all avatars (public bucket)
DROP POLICY IF EXISTS "avatar_read_all" ON storage.objects;
CREATE POLICY "avatar_read_all"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- Allow anon to read avatars (public display)
DROP POLICY IF EXISTS "avatar_read_anon" ON storage.objects;
CREATE POLICY "avatar_read_anon"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'avatars');

-- Allow authenticated users to update their own avatar
DROP POLICY IF EXISTS "avatar_update_own" ON storage.objects;
CREATE POLICY "avatar_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own avatar
DROP POLICY IF EXISTS "avatar_delete_own" ON storage.objects;
CREATE POLICY "avatar_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
