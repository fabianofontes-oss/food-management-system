SELECT tablename, count(*) AS policies
FROM pg_policies
WHERE schemaname='public'
GROUP BY tablename
ORDER BY policies DESC, tablename;
