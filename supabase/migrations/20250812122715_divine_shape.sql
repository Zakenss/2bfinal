/*
  # Add couverture sent tracking

  1. Changes
    - Add `couverture_sent` boolean column to `book_lists` table
    - Add `couverture_sent_at` timestamp column to track when it was sent
    - Add `couverture_sent_by` text column to track who sent it
    - Set default value to false for existing records

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add couverture_sent column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'book_lists' AND column_name = 'couverture_sent'
  ) THEN
    ALTER TABLE book_lists ADD COLUMN couverture_sent boolean DEFAULT false;
  END IF;
END $$;

-- Add couverture_sent_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'book_lists' AND column_name = 'couverture_sent_at'
  ) THEN
    ALTER TABLE book_lists ADD COLUMN couverture_sent_at timestamptz;
  END IF;
END $$;

-- Add couverture_sent_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'book_lists' AND column_name = 'couverture_sent_by'
  ) THEN
    ALTER TABLE book_lists ADD COLUMN couverture_sent_by text;
  END IF;
END $$;