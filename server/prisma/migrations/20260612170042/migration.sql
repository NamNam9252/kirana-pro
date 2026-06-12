-- Re-ensure PostGIS column exists (handles Prisma schema drift).
-- The geometry column is managed outside Prisma since it doesn't support geometry types.
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "location" geometry(Point, 4326);
CREATE INDEX IF NOT EXISTS "Shop_location_gist_idx" ON "Shop" USING GIST ("location");
