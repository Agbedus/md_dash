'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

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

    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
        return "Email already in use";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
        email,
        fullName,
        password: hashedPassword,
        roles: ['staff'], // Default role
        createdAt: new Date().toISOString(),
    });

    return "User created successfully";
}

export async function logout() {
    await signOut();
}
