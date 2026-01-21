-- Tenants Database Schema
-- Turso (libSQL) DDL statements
-- 
-- Security Model:
-- - All sensitive data stored as encrypted TEXT blobs
-- - Encryption performed in application layer before database write
-- - Decryption performed only in backend API layer
-- - Each user's data encrypted with user-specific key derived from Firebase UID

-- ============================================
-- USERS TABLE
-- ============================================
-- Non-sensitive user information
-- Firebase UID is the primary identifier
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firebase_uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'OWNER' CHECK(role IN ('OWNER', 'MANAGER', 'READ_ONLY')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- PROPERTIES TABLE
-- ============================================
-- Property records with encrypted sensitive data
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_uid TEXT NOT NULL, -- Firebase UID of owner
    
    -- Encrypted payload contains:
    -- { name, address, city, state, zip, country, notes }
    encrypted_data TEXT NOT NULL,
    
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    FOREIGN KEY (owner_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

CREATE INDEX idx_properties_owner ON properties(owner_uid);

-- ============================================
-- UNITS TABLE
-- ============================================
-- Rental units within properties
CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    owner_uid TEXT NOT NULL, -- Denormalized for access control
    
    unit_number TEXT, -- Non-sensitive identifier
    monthly_rent REAL, -- Non-sensitive
    
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_owner ON units(owner_uid);

-- ============================================
-- TENANTS TABLE
-- ============================================
-- Tenant information (highly sensitive)
CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    owner_uid TEXT NOT NULL, -- Denormalized for access control
    
    -- Encrypted payload contains:
    -- { firstName, lastName, email, phone, emergencyContact, notes }
    encrypted_data TEXT NOT NULL,
    
    lease_start_date INTEGER, -- Unix timestamp (non-sensitive)
    lease_end_date INTEGER, -- Unix timestamp (non-sensitive)
    is_active INTEGER DEFAULT 1, -- 0 = inactive, 1 = active
    
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

CREATE INDEX idx_tenants_unit ON tenants(unit_id);
CREATE INDEX idx_tenants_owner ON tenants(owner_uid);
CREATE INDEX idx_tenants_active ON tenants(is_active);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
-- Payment records (metadata only, no sensitive financial data)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    owner_uid TEXT NOT NULL, -- Denormalized for access control
    
    amount REAL NOT NULL,
    payment_date INTEGER NOT NULL, -- Unix timestamp
    payment_method TEXT, -- e.g., 'check', 'bank_transfer', 'cash'
    notes TEXT,
    
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_owner ON payments(owner_uid);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
-- Automatically update updated_at timestamp

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_properties_timestamp 
AFTER UPDATE ON properties
BEGIN
    UPDATE properties SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_units_timestamp 
AFTER UPDATE ON units
BEGIN
    UPDATE units SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tenants_timestamp 
AFTER UPDATE ON tenants
BEGIN
    UPDATE tenants SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_payments_timestamp 
AFTER UPDATE ON payments
BEGIN
    UPDATE payments SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;
