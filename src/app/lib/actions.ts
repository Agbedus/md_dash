'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';

const API_BASE_URL = `${process.env.BASE_URL_LOCAL}/api/v1` || "http://127.0.0.1:8000/api/v1";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
});

export async function register(prevState: string | undefined, formData: FormData) {
    const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return "Invalid fields";
    }

    const { email, password, fullName } = validatedFields.data;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                full_name: fullName
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Registration failed:", errorText);
            
            // Try to parse JSON error if possible
            try {
                const errorJson = JSON.parse(errorText);
                return errorJson.detail || "Registration failed";
            } catch {
                return "Registration failed. Please try again.";
            }
        }
        
    } catch (error) {
        console.error("Registration error:", error);
        return "Network error during registration";
    }

    return "User created successfully";
}

export async function logout() {
    // Optionally call API logout endpoint if needed to invalidate token on server
    // const res = await fetch(`${API_BASE_URL}/auth/logout`); ...
    await signOut();
}
