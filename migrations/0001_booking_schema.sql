-- session types
CREATE TABLE IF NOT EXISTS session_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    price_note TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
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

-- Blocked dates
CREATE TABLE IF NOT EXISTS blocked_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed session types
INSERT OR IGNORE INTO session_types (name, slug, duration_minutes, description, price_note, sort_order) VALUES
    ('Menu Photography', 'menu-photography', 240, 'Full menu shoots for restaurants and food businesses.', 'Starting at $500', 1),
  ('Product Photography', 'product-photography', 180, 'Product line shoots for brands and e-commerce.', 'Starting at $500', 2),
  ('Headshots', 'headshots', 60, 'Professional headshots for individuals and teams.', 'Starting at $200', 3),
  ('Event Coverage', 'event-coverage', 300, 'Full event documentation for corporate and private events.', 'Starting at $800', 4),
  ('Custom Session', 'custom-session', 120, 'Anything else. Let''s talk about what you need.', 'Custom pricing', 5);
