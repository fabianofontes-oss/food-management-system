SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='tenants'
  AND column_name IN ('status','trial_ends_at','past_due_since')
ORDER BY column_name;
