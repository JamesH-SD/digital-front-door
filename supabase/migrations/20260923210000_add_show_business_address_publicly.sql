-- F3B: explicit permission to show business street address on hosted public website
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS show_business_address_publicly boolean NOT NULL DEFAULT false;
