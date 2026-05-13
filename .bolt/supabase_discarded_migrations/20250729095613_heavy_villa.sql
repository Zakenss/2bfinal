/*
  # Fix telephone column constraint

  1. Changes
    - Remove NOT NULL constraint from telephone column in book_lists table
    - Allow empty string as default value instead of null

  2. Security
    - No changes to RLS policies needed
*/

-- Remove NOT NULL constraint from telephone column
ALTER TABLE book_lists ALTER COLUMN telephone DROP NOT NULL;

-- Set default value to empty string for consistency
ALTER TABLE book_lists ALTER COLUMN telephone SET DEFAULT '';