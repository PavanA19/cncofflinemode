// // utils/authDB.ts
// import * as SQLite from 'expo-sqlite';

// const db = SQLite.openDatabaseSync('user_auth.db');

// export const setupAuthDB = async (): Promise<void> => {
//   try {
//     await db.execAsync(`
//       CREATE TABLE IF NOT EXISTS users (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         email TEXT UNIQUE,
//         password TEXT
//       );
//     `);
//     console.log('✅ Auth DB initialized');
//   } catch (error) {
//     console.error('❌ Failed to setup auth DB:', error);
//   }
// };

// export const saveUserToSQLite = async (email: string, password: string): Promise<void> => {
//   try {
//     await db.runAsync(
//       `INSERT OR REPLACE INTO users (email, password) VALUES (?, ?);`,
//       [email, password]
//     );
//     console.log(`✅ Saved user to SQLite: ${email}`);
//   } catch (error) {
//     console.error('❌ Failed to save user to SQLite:', error);
//   }
// };

// export const getUserFromSQLite = async (
//   email: string
// ): Promise<{ email: string; password: string } | null> => {
//   try {
//     const row = await db.getFirstAsync<Record<string, any>>(
//       `SELECT email, password FROM users WHERE email = ?`,
//       [email]
//     );

//     if (row?.email && row?.password) {
//       console.log(`✅ Fetched user from SQLite: ${email}`);
//       return {
//         email: row.email,
//         password: row.password,
//       };
//     }

//     return null;
//   } catch (error) {
//     console.error('❌ Failed to fetch user from SQLite:', error);
//     return null;
//   }
// };

// // Optional: delete all users (for logout or testing)
// export const deleteAllUsers = async (): Promise<void> => {
//   try {
//     await db.runAsync(`DELETE FROM users;`);
//     console.log('🗑️ All users deleted from auth DB');
//   } catch (error) {
//     console.error('❌ Failed to delete users from auth DB:', error);
//   }
// };





// utils/authDB.ts
import * as SQLite from 'expo-sqlite';

// Open (or create) the user authentication database
const db = SQLite.openDatabaseSync('user_auth.db');

/**
 * Setup the SQLite DB table for storing user credentials.
 */
export const setupAuthDB = async (): Promise<void> => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
      );
    `);
    console.log('✅ Auth DB initialized');
  } catch (error) {
    console.error('❌ Failed to setup auth DB:', error);
  }
};

/**
 * Save or update a user’s email and password in SQLite.
 */
export const saveUserToSQLite = async (email: string, password: string): Promise<void> => {
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO users (email, password) VALUES (?, ?);`,
      [email, password]
    );
    console.log(`✅ Saved user to SQLite: ${email}`);
  } catch (error) {
    console.error('❌ Failed to save user to SQLite:', error);
  }
};

/**
 * Fetch a user's credentials from SQLite by email.
 */
export const getUserFromSQLite = async (
  email: string
): Promise<{ email: string; password: string } | null> => {
  try {
    const row = await db.getFirstAsync<{ email: string; password: string }>(
      `SELECT email, password FROM users WHERE email = ?`,
      [email]
    );

    if (row?.email && row?.password) {
      console.log(`✅ Fetched user from SQLite: ${email}`);
      return row;
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to fetch user from SQLite:', error);
    return null;
  }
};

/**
 * Delete all stored users (optional for testing or logout).
 */
export const deleteAllUsers = async (): Promise<void> => {
  try {
    await db.runAsync(`DELETE FROM users;`);
    console.log('🗑️ All users deleted from auth DB');
  } catch (error) {
    console.error('❌ Failed to delete users from auth DB:', error);
  }
};
