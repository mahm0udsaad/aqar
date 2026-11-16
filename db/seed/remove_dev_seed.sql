-- Removes everything db/seed/dev_seed.sql created (local development only).
BEGIN;
DELETE FROM properties WHERE contact_email = 'seed@test.aqar.local';
DELETE FROM user_profiles WHERE email LIKE '%@test.aqar.local';
COMMIT;
