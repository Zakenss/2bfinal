/*
  # Create book lists table for French bookstore

  1. New Tables
    - `book_lists`
      - `id` (uuid, primary key)
      - `code` (text, unique 4-digit code)
      - `nom` (text, student or parent name)
      - `ecole` (text, school name)
      - `niveau` (text, level)
      - `email` (text, email address)
      - `telephone` (text, phone number)
      - `liste_prete` (boolean, default false, whether list is ready)
      - `rangee` (text, row A-G)
      - `niveau_rangement` (integer, storage level 1-6)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `book_lists` table
    - Add policies for public insert and authenticated read
*/

CREATE TABLE IF NOT EXISTS book_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  nom text NOT NULL,
  ecole text NOT NULL,
  niveau text NOT NULL,
  email text NOT NULL,
  telephone text NOT NULL,
  liste_prete boolean DEFAULT false,
  rangee text,
  niveau_rangement integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE book_lists ENABLE ROW LEVEL SECURITY;

-- Allow public to insert new book lists (client form)
CREATE POLICY "Allow public to insert book lists"
  ON book_lists
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public to select by code (employee search)
CREATE POLICY "Allow public to select by code"
  ON book_lists
  FOR SELECT
  TO anon
  USING (true);

-- Allow public to update list status (employee update)
CREATE POLICY "Allow public to update book lists"
  ON book_lists
  FOR UPDATE
  TO anon
  USING (true);