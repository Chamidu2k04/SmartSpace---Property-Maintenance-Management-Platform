-- ============================================
-- CLEANUP LEGACY TEST DATA
-- ============================================
-- Purpose: Removes OLD test tickets created BEFORE tagging
-- Pattern: 'Load test issue%'
-- Safe to run on Supabase SQL Editor
-- Expected: legacy_test_data = 0, real_data = unchanged
-- ============================================

BEGIN;

-- Step 1: Delete images belonging to legacy test tickets
DELETE FROM "TicketImages"
WHERE "TicketId" IN (
    SELECT "Id" FROM "MaintenanceTickets"
    WHERE "Description" LIKE 'Load test issue%'
);

-- Step 2: Delete legacy test tickets
DELETE FROM "MaintenanceTickets"
WHERE "Description" LIKE 'Load test issue%';

-- Step 3: Verification
-- Expected: legacy_test_data = 0, real_data = 42, total = 42
SELECT
    COUNT(*) FILTER (WHERE "Description" LIKE 'Load test issue%') AS legacy_test_data,
    COUNT(*) FILTER (WHERE "Description" NOT LIKE 'Load test issue%') AS real_data,
    COUNT(*) AS total
FROM "MaintenanceTickets";

COMMIT;