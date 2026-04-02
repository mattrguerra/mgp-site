-- Make client_phone nullable by recreating the bookings table
-- SQLite doesn't support ALTER COLUMN, so we rebuild

CREATE TABLE IF NOT EXISTS bookings_new (
    id TEXT PRIMARY KEY,
    session_type_id INTEGER REFERENCES session_types(id),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    business_name TEXT,
    description TEXT,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    gcal_event_id TEXT,
    honeybook_link TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bookings_new SELECT * FROM bookings;

DROP TABLE bookings;

ALTER TABLE bookings_new RENAME TO bookings;
