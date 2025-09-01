-- Create a test user in the users table
-- This user will be used for login testing

INSERT INTO public.users (
  id,
  email,
  role,
  name,
  phone,
  department,
  created_at,
  updated_at
)
VALUES (
  'c0f8da53-0319-4b0a-a4ea-8d95e94565b7'::uuid,
  'drinorshabiu1@gmail.com',
  'admin',
  'drinor',
  '+383 44 123 456',
  'IT',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  department = EXCLUDED.department,
  updated_at = now();

-- Verify the user was created/updated
SELECT * FROM public.users WHERE email = 'drinorshabiu1@gmail.com';
