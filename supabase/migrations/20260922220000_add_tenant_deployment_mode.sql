-- Tenant deployment surface: existing third-party site vs Contactor-hosted website.
-- NULL = unset (legacy tenants); application must not infer mode from website_url.

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS deployment_mode text;

ALTER TABLE tenants
DROP CONSTRAINT IF EXISTS tenants_deployment_mode_check;

ALTER TABLE tenants
ADD CONSTRAINT tenants_deployment_mode_check
CHECK (
  deployment_mode IS NULL
  OR deployment_mode IN ('existing_site', 'hosted')
);

COMMENT ON COLUMN tenants.deployment_mode IS
  'Customer-facing surface: existing_site (widget on tenant website) or hosted (Contactor website).';
