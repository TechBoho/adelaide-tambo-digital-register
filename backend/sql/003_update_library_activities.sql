BEGIN;

UPDATE activities
SET is_active = FALSE
WHERE name = 'Gaming'
  AND category = 'ICT Facilities';

INSERT INTO activities (category, name, is_active)
SELECT 'Library Services', 'Enquiries', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM activities
  WHERE category = 'Library Services'
    AND name = 'Enquiries'
);

INSERT INTO activities (category, name, is_active)
SELECT 'Library Services', 'Programmes', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM activities
  WHERE category = 'Library Services'
    AND name = 'Programmes'
);

COMMIT;