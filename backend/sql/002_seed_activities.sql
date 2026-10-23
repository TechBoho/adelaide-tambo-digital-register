
INSERT INTO activities (category, name)
VALUES
    ('Public Facilities', 'Study'),
    ('Public Facilities', 'Reading'),
    ('Public Facilities', 'Research'),
    ('ICT Facilities', 'Internet'),
    ('ICT Facilities', 'Gaming'),
    ('ICT Facilities', 'Typing'),
    ('Library Services', 'Book Borrowing'),
    ('Library Services', 'Booking'),
    ('Library Services', 'Other Approved Services')
ON CONFLICT (name) DO NOTHING;
