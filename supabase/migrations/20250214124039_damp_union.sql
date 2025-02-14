/*
  # Create companies table

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
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
    - Add policies for authenticated users to read and insert data
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);