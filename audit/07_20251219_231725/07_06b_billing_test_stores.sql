SELECT s.slug, t.status, t.trial_ends_at, t.past_due_since
FROM public.stores s
JOIN public.tenants t ON t.id = s.tenant_id
WHERE s.slug IN ('test-active','test-trial-expired','test-past-due','test-suspended')
ORDER BY s.slug;
