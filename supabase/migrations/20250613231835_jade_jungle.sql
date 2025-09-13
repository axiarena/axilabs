/*
  # Initial Schema for AXI AGI LAB

  1. New Tables
    - `axioms`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text)
      - `language` (text)
      - `is_public` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `author_id` (text)
      - `author_name` (text)
      - `shader_number` (integer, nullable)
      - `description` (text, nullable)
      - `tags` (text array, nullable)
      - `likes` (integer, default 0)
      - `views` (integer, default 0)
      - `featured` (boolean, default false)

    - `folders`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `created_at` (timestamp)
      - `author_id` (text)
      - `author_name` (text)
      - `is_public` (boolean)
      - `axiom_ids` (text array)
      - `color` (text, nullable)

    - `comments`
      - `id` (uuid, primary key)
      - `axiom_id` (uuid, foreign key)
      - `author_id` (text)
      - `author_name` (text)
      - `content` (text)
      - `created_at` (timestamp)
      - `likes` (integer, default 0)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to public content

  3. Functions
    - `increment_likes` function for atomic like operations
    - `increment_views` function for atomic view operations
    - `get_next_shader_number` function for auto-incrementing shader numbers
*/

-- Create axioms table
CREATE TABLE IF NOT EXISTS axioms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  language text NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  author_id text NOT NULL,
  author_name text NOT NULL,
  shader_number integer,
  description text,
  tags text[],
  likes integer DEFAULT 0,
  views integer DEFAULT 0,
  featured boolean DEFAULT false
);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  author_id text NOT NULL,
  author_name text NOT NULL,
  is_public boolean DEFAULT false,
  axiom_ids text[] DEFAULT '{}',
  color text
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  axiom_id uuid REFERENCES axioms(id) ON DELETE CASCADE,
  author_id text NOT NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  likes integer DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE axioms ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies for axioms table
CREATE POLICY "Public axioms are viewable by everyone"
  ON axioms
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own axioms"
  ON axioms
  FOR SELECT
  USING (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own axioms"
  ON axioms
  FOR INSERT
  WITH CHECK (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own axioms"
  ON axioms
  FOR UPDATE
  USING (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own axioms"
  ON axioms
  FOR DELETE
  USING (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policies for folders table
CREATE POLICY "Public folders are viewable by everyone"
  ON folders
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own folders"
  ON folders
  FOR SELECT
  USING (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own folders"
  ON folders
  FOR INSERT
  WITH CHECK (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own folders"
  ON folders
  FOR UPDATE
  USING (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own folders"
  ON folders
  FOR DELETE
  USING (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policies for comments table
CREATE POLICY "Comments are viewable by everyone"
  ON comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert comments"
  ON comments
  FOR INSERT
  WITH CHECK (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  USING (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  USING (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Function to increment likes atomically
CREATE OR REPLACE FUNCTION increment_likes(axiom_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE axioms 
  SET likes = likes + 1, updated_at = now()
  WHERE id = axiom_id;
END;
$$;

-- Function to increment views atomically
CREATE OR REPLACE FUNCTION increment_views(axiom_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE axioms 
  SET views = views + 1, updated_at = now()
  WHERE id = axiom_id;
END;
$$;

-- Function to get next shader number
CREATE OR REPLACE FUNCTION get_next_shader_number()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  next_number integer;
BEGIN
  SELECT COALESCE(MAX(shader_number), 0) + 1 
  INTO next_number 
  FROM axioms 
  WHERE is_public = true;
  
  RETURN next_number;
END;
$$;

-- Trigger to auto-assign shader numbers for public axioms
CREATE OR REPLACE FUNCTION assign_shader_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_public = true AND NEW.shader_number IS NULL THEN
    NEW.shader_number = get_next_shader_number();
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_shader_number_trigger
  BEFORE INSERT OR UPDATE ON axioms
  FOR EACH ROW
  EXECUTE FUNCTION assign_shader_number();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_axioms_author_id ON axioms(author_id);
CREATE INDEX IF NOT EXISTS idx_axioms_is_public ON axioms(is_public);
CREATE INDEX IF NOT EXISTS idx_axioms_shader_number ON axioms(shader_number);
CREATE INDEX IF NOT EXISTS idx_axioms_featured ON axioms(featured);
CREATE INDEX IF NOT EXISTS idx_axioms_created_at ON axioms(created_at);
CREATE INDEX IF NOT EXISTS idx_folders_author_id ON folders(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_axiom_id ON comments(axiom_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);