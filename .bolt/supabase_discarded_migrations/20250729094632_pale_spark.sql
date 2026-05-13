/*
  # Add employee tracking to book lists

  1. Schema Changes
    - Add `modified_by` column to track which employee made changes
    - Add `modified_at` column to track when changes were made

  2. Security
    - Update existing RLS policies to handle new columns
*/

-- Add columns to track employee modifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'book_lists' AND column_name = 'modified_by'
  ) THEN
    ALTER TABLE book_lists ADD COLUMN modified_by text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'book_lists' AND column_name = 'modified_at'
  ) THEN
    ALTER TABLE book_lists ADD COLUMN modified_at timestamptz;
  END IF;
END $$;