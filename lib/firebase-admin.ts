/**
 * Firebase Admin SDK Configuration
 * 
 * Server-side Firebase configuration for token verification and admin operations.
 * Used exclusively in API routes and server-side code.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let firebaseAdminApp: App;

/**
 * Initialize Firebase Admin SDK
 * Uses singleton pattern to prevent multiple initializations
 */
export function getFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      // Initialize with service account credentials from environment
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error) {
      throw new Error('Failed to initialize Firebase Admin SDK');
    }
  } else {
    firebaseAdminApp = getApps()[0];
  }

  return firebaseAdminApp;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAdminAuth() {
  const app = getFirebaseAdmin();
  return getAuth(app);
}
