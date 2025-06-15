import { supabase } from './lib/supabase';

async function testAuth() {
  // Test email validation
  const testEmails = [
    'test@example.com', // valid
    'invalid-email', // invalid
    'test@.com', // invalid
    'test@example', // invalid
  ];

  console.log('Testing email validation:');
  testEmails.forEach(email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    console.log(`${email}: ${emailRegex.test(email) ? 'valid' : 'invalid'}`);
  });

  // Test password validation
  const testPasswords = [
    'Password123!', // valid
    'short', // invalid
    'password', // invalid (no uppercase)
    'PASSWORD', // invalid (no lowercase)
    'Password', // invalid (no number)
    'Password123', // invalid (no special char)
  ];

  console.log('\nTesting password validation:');
  testPasswords.forEach(password => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 6;

    const isValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isLongEnough;
    console.log(`${password}: ${isValid ? 'valid' : 'invalid'}`);
  });

  // Test Supabase connection
  console.log('\nTesting Supabase connection:');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection error:', error.message);
    } else {
      console.log('Supabase connection successful');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAuth(); 