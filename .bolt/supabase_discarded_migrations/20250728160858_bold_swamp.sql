/*
  # Create nom_ecole table

  1. New Tables
    - `nom_ecole`
      - `nom_ecole` (text, primary key) - Name of the school
  
  2. Security
    - Enable RLS on `nom_ecole` table
    - Add policies for anonymous and authenticated users to read and write data
*/

CREATE TABLE IF NOT EXISTS nom_ecole (
  nom_ecole text PRIMARY KEY
);

ALTER TABLE nom_ecole ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous users to select schools"
  ON nom_ecole
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated users to select schools"
  ON nom_ecole
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anonymous users to insert schools"
  ON nom_ecole
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert schools"
  ON nom_ecole
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete schools"
  ON nom_ecole
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert some initial school data
INSERT INTO nom_ecole (nom_ecole) VALUES
  ('École Primaire Al Andalous'),
  ('Collège Ibn Khaldoun'),
  ('Lycée Hassan II'),
  ('École Internationale de Casablanca'),
  ('Groupe Scolaire La Résidence')
ON CONFLICT (nom_ecole) DO NOTHING;