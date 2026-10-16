-- ============================================
-- CLEANUP TEST DATA (NEW TAG)
-- ============================================
-- Purpose: Removes test tickets tagged with [LOADTEST]
-- Safe to run on Supabase SQL Editor
-- Expected: test_data = 0, real_data = unchanged
-- ============================================

BEGIN;

-- Step 0: PREVIEW — count rows that WILL be deleted (review before commit)
-- The preview step is for the operator to review counts before COMMIT.
-- If the preview counts look wrong, the operator can ROLLBACK instead of COMMIT.
SELECT
    COUNT(*) FILTER (WHERE "Description" LIKE '[LOADTEST]%') AS images_to_delete
FROM "TicketImages"
WHERE "TicketId" IN (
    SELECT "Id" FROM "MaintenanceTickets"
    WHERE "Description" LIKE '[LOADTEST]%'
);

SELECT
    COUNT(*) AS tickets_to_delete
FROM "MaintenanceTickets"
WHERE "Description" LIKE '[LOADTEST]%';

-- Step 1: Delete images belonging to test tickets
-- (Images must be deleted first due to foreign key constraint)
DELETE FROM "TicketImages"
WHERE "TicketId" IN (
    SELECT "Id" FROM "MaintenanceTickets"
    WHERE "Description" LIKE '[LOADTEST]%'
);

-- Step 2: Delete test tickets
DELETE FROM "MaintenanceTickets"
WHERE "Description" LIKE '[LOADTEST]%';

-- Step 3: Verification
-- Expected: test_data = 0, real_data = 42, total = 42
SELECT
    COUNT(*) FILTER (WHERE "Description" LIKE '[LOADTEST]%') AS test_data,
    COUNT(*) FILTER (WHERE "Description" NOT LIKE '[LOADTEST]%') AS real_data,
    COUNT(*) AS total
FROM "MaintenanceTickets";

COMMIT;
