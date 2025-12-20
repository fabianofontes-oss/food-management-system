SELECT cmd, count(*) AS policies
FROM pg_policies
WHERE schemaname='public' AND tablename='admin_audit_logs'
GROUP BY cmd
ORDER BY cmd;
