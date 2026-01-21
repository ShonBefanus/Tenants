/**
 * Turso Database Configuration
 * 
 * libSQL client setup for database operations
 */

import { createClient } from '@libsql/client';

let db: ReturnType<typeof createClient> | null = null;

/**
 * Get database client (singleton)
 */
export function getDatabase() {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL environment variable is not set');
    }

    if (!authToken) {
      throw new Error('TURSO_AUTH_TOKEN environment variable is not set');
    }

    db = createClient({
      url,
      authToken,
    });
  }

  return db;
}
