/*
  # Create users table

  Replaces portal_users with a new users table, matching the same pattern
  as ecoles and students. Migrates existing data and drops the old table.

  ## New Table
  - `users`
    - `id` (uuid, primary key)
    - `space` (text) - 'espace_client' or 'espace_adjoint'
    - `username` (text) - display name
    - `email` (text) - login identifier
    - `password` (text) - plain-text app-level password
    - `role` (text) - 'admin', 'user', or 'couverture'
    - `active` (boolean)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled with same anon policies as portal_users
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space text NOT NULL CHECK (space IN ('espace_client', 'espace_adjoint')),
  username text NOT NULL DEFAULT '',
  email text NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'couverture')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Migrate existing data if portal_users exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_users') THEN
    INSERT INTO users (id, space, username, email, password, role, active, created_at, updated_at)
    SELECT id, space, username, email, password, role, active, created_at, updated_at
    FROM portal_users
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active users for login"
  ON users
  FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "Anon can insert users"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update users"
  ON users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete users"
  ON users
  FOR DELETE
  TO anon
  USING (true);

-- Drop old table if it exists
DROP TABLE IF EXISTS portal_users CASCADE;
