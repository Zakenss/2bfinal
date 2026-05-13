/*
  # Add couverture_demandee column to book_lists table

  1. Changes
    - Add `couverture_demandee` column to `book_lists` table
    - Column type: boolean with default value false
    - Column is nullable to handle existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'book_lists' AND column_name = 'couverture_demandee'
  ) THEN
    ALTER TABLE book_lists ADD COLUMN couverture_demandee boolean DEFAULT false;
  END IF;
END $$;