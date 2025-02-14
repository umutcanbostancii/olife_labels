/*
  # Create companies table with anonymous access

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `date` (text)
      - `company_name` (text)
      - `contact_name` (text)
      - `street` (text)
      - `city` (text)
      - `state` (text)
      - `country` (text)
      - `zip_code` (text)
      - `mobile_number` (text)
      - `email` (text)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `companies` table
    - Add policies for anonymous access to read and insert data
*/

DO $$ BEGIN
  -- Drop existing table if it exists
  DROP TABLE IF EXISTS companies;
  
  -- Create new table with correct column names
  CREATE TABLE companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date text NOT NULL,
    company_name text NOT NULL,
    contact_name text,
    street text,
    city text,
    state text,
    country text,
    zip_code text,
    mobile_number text,
    email text,
    created_at timestamptz DEFAULT now()
  );

  -- Enable RLS
  ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

  -- Create policies for anonymous access
  CREATE POLICY "Allow anonymous read access"
    ON companies
    FOR SELECT
    TO anon
    USING (true);

  CREATE POLICY "Allow anonymous insert access"
    ON companies
    FOR INSERT
    TO anon
    WITH CHECK (true);
END $$;