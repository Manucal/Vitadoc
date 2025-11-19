DELETE FROM users WHERE email = 'admin@vitadoc.com';

INSERT INTO users (id, tenant_id, username, email, password_hash, full_name, role, status, created_at)
VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'admin',
  'admin@vitadoc.com',
  '$2a$12$R9h7cIPz0gi.URNNX3kh2O14JLUjZeJL8FEwYzS4/2TmEbPEgxWa6',
  'VitaDoc Admin',
  'admin',
  'active',
  NOW()
);
