SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='admin_audit_logs'
ORDER BY grantee, privilege_type;
