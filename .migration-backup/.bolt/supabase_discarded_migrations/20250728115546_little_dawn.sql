/*
  # Fix RLS policy for book_lists table

  1. Security Changes
    - Add policy to allow anonymous users to insert into book_lists table
    - This enables the client form to submit data without authentication

  The current policy only allows authenticated users to insert, but the client form
  is used by anonymous users (the general public) to submit their book lists.
*/

-- Allow anonymous users to insert book lists
CREATE POLICY "Allow anonymous users to insert book lists"
  ON book_lists
  FOR INSERT
  TO anon
  WITH CHECK (true);