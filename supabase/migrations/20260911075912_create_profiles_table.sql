/*
# Create profiles table for security testing app

1. New Tables
- `profiles`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, unique)
  - `username` (text, unique, not null) — display name used for login
  - `email` (text, unique, not null) — stored for Supabase auth email lookup
  - `created_at` (timestamptz)

2. Security
- Enable RLS on `profiles`.
- anon + authenticated can SELECT (needed so the login page can look up
  the auth email by username before calling signInWithPassword).
- authenticated can INSERT/UPDATE/DELETE only their own profile row.

3. Notes
- The username column is unique, preventing duplicate usernames at the DB level.
- The email column is unique, preventing duplicate emails at the DB level.
- Supabase Auth also enforces email uniqueness independently.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anon + authenticated to read profiles (login lookup by username)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  TO anon, authenticated USING (true);

-- Authenticated users can insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own profile
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
