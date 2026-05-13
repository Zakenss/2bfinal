/*
  # Insert all schools from CSV data

  1. New Data
    - Insert all 21 schools from the customers_rows.csv file
    - Uses ON CONFLICT DO NOTHING to avoid duplicates

  2. Schools Added
    - ECOLE AUGUSTE
    - ECOLE AL MANAR  
    - ECOLE JACQUES LACAN
    - ECOLE JOURI
    - ECOLE SOFIA
    - ECOLE AL MAWAKEB
    - ECOLE AFWAJ
    - ECOLE EXCEL ACADEMY
    - ECOLE AFAK AJAIL
    - ECOLE ELLA MAILLART
    - ECOLE 2 PALMIERS
    - ECOLE NOUR AL MANAR
    - ECOLE HILALI TARGA
    - ECOLE EL AMRANI
    - ECOLE ELBILIA
    - ECOLE AL JALIL
    - ECOLE LA SAADIA
    - ECOLE TARGA
    - ECOLE NIDAL
    - ECOLE AL HIKMA

  3. Safety
    - Uses ON CONFLICT DO NOTHING to prevent duplicate entries
    - Will only insert schools that don't already exist
*/

INSERT INTO nom_ecole (nom_ecole) VALUES
('ECOLE AUGUSTE'),
('ECOLE AL MANAR'),
('ECOLE JACQUES LACAN'),
('ECOLE JOURI'),
('ECOLE SOFIA'),
('ECOLE AL MAWAKEB'),
('ECOLE AFWAJ'),
('ECOLE EXCEL ACADEMY'),
('ECOLE AFAK AJAIL'),
('ECOLE ELLA MAILLART'),
('ECOLE 2 PALMIERS'),
('ECOLE NOUR AL MANAR'),
('ECOLE HILALI TARGA'),
('ECOLE EL AMRANI'),
('ECOLE ELBILIA'),
('ECOLE AL JALIL'),
('ECOLE LA SAADIA'),
('ECOLE TARGA'),
('ECOLE NIDAL'),
('ECOLE AL HIKMA')
ON CONFLICT (nom_ecole) DO NOTHING;