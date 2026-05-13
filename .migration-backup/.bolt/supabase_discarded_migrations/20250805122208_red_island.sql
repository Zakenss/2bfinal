/*
  # Add genre column to book_lists table

  1. Changes
    - Add `genre` column to `book_lists` table
    - Column type: TEXT (nullable)
    - Allows storing gender information for each child

  2. Notes
    - This column is optional and can be null
    - Supports values like 'fille', 'garcon', or null
*/

-- Add genre column to book_lists table
ALTER TABLE book_lists ADD COLUMN IF NOT EXISTS genre TEXT;