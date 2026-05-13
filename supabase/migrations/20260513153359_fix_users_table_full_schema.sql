/*
  # Fix users table

  The auto-created users table only had id + created_at.
  This drops it and recreates it with the full schema needed for app-level auth.

  ## Table: users
  - id (uuid, primary key)
  - space (text) - 'espace_client' or 'espace_adjoint'
  - username (text) - display name
  - email (text) - login identifier
  - password (text) - plain-text app-level password
  - role (text) - 'admin', 'user', or 'couverture'
  - active (boolean)
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ## Security
  - RLS enabled
  - Anon can SELECT active users (needed for login flow)
  - Anon can INSERT/UPDATE/DELETE (app-level admin controls access)

  ## Seeds
  - Default credentials for espace_client
*/

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
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

INSERT INTO users (space, username, email, password, role, active)
VALUES
  ('espace_client', 'Aicha Benzangue', 'aichabenzangue@gmail.com', 'scolaire25', 'admin', true),
  ('espace_client', 'Lib2B Admin', 'lib2b@gmail.com', 'lib2b2025', 'couverture', true)
ON CONFLICT DO NOTHING;
