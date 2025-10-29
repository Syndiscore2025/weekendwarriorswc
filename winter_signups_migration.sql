-- Migration: Create winter_signups_2025 table for Winter 2025 Partnership Sign Ups
-- Run this in Supabase SQL Editor

-- Create the winter_signups_2025 table
CREATE TABLE IF NOT EXISTS winter_signups_2025 (
  id BIGSERIAL PRIMARY KEY,
  parent_name TEXT NOT NULL,
  wrestler_name TEXT NOT NULL,
  wrestler_dob DATE NOT NULL,
  wrestler_grade TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE winter_signups_2025 ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to insert (sign up)
CREATE POLICY IF NOT EXISTS "public insert winter signups" 
ON winter_signups_2025 
FOR INSERT 
WITH CHECK (true);

-- Policy: Only admins can read signups
CREATE POLICY IF NOT EXISTS "admins read winter signups" 
ON winter_signups_2025 
FOR SELECT 
USING (
  EXISTS(SELECT 1 FROM admins a WHERE a.email = auth.email())
);

-- Policy: Only admins can delete signups
CREATE POLICY IF NOT EXISTS "admins delete winter signups" 
ON winter_signups_2025 
FOR DELETE 
USING (
  EXISTS(SELECT 1 FROM admins a WHERE a.email = auth.email())
);

-- Verify the table was created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'winter_signups_2025'
ORDER BY ordinal_position;

