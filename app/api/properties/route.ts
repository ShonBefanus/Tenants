/**
 * Properties API Route
 * POST /api/properties - Create a new property
 * 
 * Example of authenticated API route with encrypted data storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth-middleware';
import { getDatabase } from '@/lib/database';
import { encryptField } from '@/lib/encryption';
import { PropertyData } from '@/lib/types';
import { z } from 'zod';

// Validation schema
const createPropertySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  notes: z.string().max(1000).optional(),
});

async function handler(request: NextRequest, user: AuthenticatedUser): Promise<Response> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPropertySchema.parse(body);

    // Encrypt sensitive property data
    const encryptedData = encryptField<PropertyData>(validatedData, user.uid);

    // Store in database
    const db = getDatabase();
    const result = await db.execute({
      sql: `INSERT INTO properties (owner_uid, encrypted_data) VALUES (?, ?)`,
      args: [user.uid, encryptedData],
    });

    return NextResponse.json({
      success: true,
      propertyId: result.lastInsertRowid,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
