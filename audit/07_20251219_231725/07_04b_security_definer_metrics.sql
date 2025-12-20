SELECT
  count(*) AS security_definer_total,
  sum(
    CASE
      WHEN p.proconfig IS NULL THEN 1
      WHEN NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%') THEN 1
      ELSE 0
    END
  ) AS security_definer_missing_search_path
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prosecdef = true;
