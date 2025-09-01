-- Check if user exists in users table
SELECT * FROM public.users WHERE id = 'c0f8da53-0319-4b0a-a4ea-8d95e94565b7'::uuid;

-- If no user found, create one
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
SELECT 
  'c0f8da53-0319-4b0a-a4ea-8d95e94565b7'::uuid,
  'drinorshabiu1@gmail.com',
  'admin',
  'Drinor Shabiu',
  '',
  'IT',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = 'c0f8da53-0319-4b0a-a4ea-8d95e94565b7'::uuid
);

-- Verify the user was created
SELECT * FROM public.users WHERE id = 'c0f8da53-0319-4b0a-a4ea-8d95e94565b7'::uuid;
