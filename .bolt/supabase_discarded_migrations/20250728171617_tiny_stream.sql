/*
  # Add avance and note columns to book_lists table

  1. New Columns
    - `avance` (numeric) - For storing advance payment amount in DHS
    - `note` (text) - For storing additional remarks or instructions

  2. Changes
    - Add avance column with numeric type to handle decimal values
    - Add note column with text type for storing notes
    - Both columns are nullable to maintain compatibility with existing records
*/

-- Add avance column for advance payment
ALTER TABLE book_lists ADD COLUMN IF NOT EXISTS avance numeric;

-- Add note column for additional remarks
ALTER TABLE book_lists ADD COLUMN IF NOT EXISTS note text;