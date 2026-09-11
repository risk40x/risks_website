/*
# Add avatar_url column to profiles table

1. Modified Tables
- `profiles`
  - `avatar_url` (text, nullable) — stores the public URL of the user's profile picture,
    or a data URL for locally uploaded images.

2. Security
- No policy changes needed; existing RLS policies already cover the new column
  since they operate at the row level.

3. Notes
- The column is nullable so existing profiles are unaffected.
- Avatar URLs can be either Supabase Storage public URLs or base64 data URLs
  from local file uploads.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
