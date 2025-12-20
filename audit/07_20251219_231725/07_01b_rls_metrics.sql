SELECT
  count(*) AS total_tables,
  sum(CASE WHEN c.relrowsecurity THEN 1 ELSE 0 END) AS rls_enabled,
  sum(CASE WHEN c.relforcerowsecurity THEN 1 ELSE 0 END) AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r';
