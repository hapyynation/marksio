INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (gen_random_uuid(), 'baseline_checksum', NOW(), '20240101000000_init', NULL, NULL, NOW(), 1)
ON CONFLICT (migration_name) DO NOTHING;
