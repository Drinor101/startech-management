// Script to create an admin user in Supabase
// Run this script after setting up your Supabase project

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need to add this to your .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.log('Make sure you have VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  const adminEmail = 'admin@startech.com'
  const adminPassword = 'Admin123!' // Change this to a secure password

  try {
    console.log('Creating admin user...')
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true // Auto-confirm email
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return
    }

    console.log('Auth user created:', authData.user.id)

    // Update user role to admin in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return
    }

    console.log('✅ Admin user created successfully!')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('Role: admin')
    console.log('User ID:', authData.user.id)

  } catch (error) {
    console.error('Error creating admin user:', error)
  }
}

createAdminUser()
