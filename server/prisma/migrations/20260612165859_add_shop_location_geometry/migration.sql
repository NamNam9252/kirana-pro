-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column for spatial queries (IF NOT EXISTS for idempotency)
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "location" geometry(Point, 4326);

-- Backfill existing shops that have lat/lng
UPDATE "Shop"
SET "location" = ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)
WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "location" IS NULL;

-- Create GIST spatial index for fast proximity queries
CREATE INDEX IF NOT EXISTS "Shop_location_gist_idx" ON "Shop" USING GIST ("location");