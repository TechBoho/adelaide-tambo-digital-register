
-- Adelaide Tambo Digital Visitor Register
-- Initial PostgreSQL database schema

CREATE TABLE IF NOT EXISTS visitor_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initials_surname VARCHAR(150) NOT NULL,
    visitor_count INTEGER NOT NULL CHECK (visitor_count > 0),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS registration_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL
        REFERENCES visitor_registrations(id) ON DELETE CASCADE,
    activity_id INTEGER NOT NULL
        REFERENCES activities(id),
    activity_visitor_count INTEGER NOT NULL
        CHECK (activity_visitor_count > 0),
    UNIQUE (registration_id, activity_id)
);

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registrations_date
ON visitor_registrations (registered_at);

CREATE INDEX IF NOT EXISTS idx_registration_activities_registration
ON registration_activities (registration_id);
