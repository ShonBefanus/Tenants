/**
 * Authentication Middleware
 * 
 * Verifies Firebase ID tokens and extracts authenticated user information.
 * Implements zero-trust security model - all API routes must use this middleware.
 * 
 * Security Features:
 * - Token verification using Firebase Admin SDK
 * - Automatic token expiration handling
 * - User identity extraction from verified token
 * - Role-based access control support
 */

import { NextRequest } from 'next/server';
import { getFirebaseAdminAuth } from './firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Authenticated user context
 */
export interface AuthenticatedUser {
  uid: string; // Firebase UID
  email: string | undefined;
  emailVerified: boolean;
  token: DecodedIdToken;
}

/**
 * Error response for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Extract and verify Firebase ID token from request
 * @param request - Next.js API request
 * @returns Authenticated user information
 * @throws AuthenticationError if authentication fails
 */
export async function verifyAuth(request: NextRequest): Promise<AuthenticatedUser> {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      throw new AuthenticationError('Missing authorization header', 401);
    }

    // Expect format: "Bearer <token>"
    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      throw new AuthenticationError('Invalid authorization header format', 401);
    }

    // Verify token using Firebase Admin SDK
    const auth = getFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(token, true); // checkRevoked = true
    
    // Return authenticated user context
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      token: decodedToken,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    // Firebase SDK throws various errors for invalid tokens
    throw new AuthenticationError('Invalid or expired token', 401);
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 * @param handler - The API route handler function
 * @returns Wrapped handler with authentication
 */
export function withAuth<T>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const user = await verifyAuth(request);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: error.statusCode,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Unexpected error
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
