-- Migration: Add weighin_time column to tournaments table
-- Run this in Supabase SQL Editor if you already have an existing tournaments table

-- Add the weighin_time column if it doesn't exist
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS weighin_time text;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tournaments';

