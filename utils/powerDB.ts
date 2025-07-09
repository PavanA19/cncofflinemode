import * as SQLite from 'expo-sqlite';

// Use openDatabaseSync instead of deprecated openDatabase
const db = SQLite.openDatabaseSync('powerlogs.db');

// Power log type
export interface PowerLog {
  machine: string;
  timestamp: string;
  power_value: number;
}

// Create the power_logs table if not exists
export const setupPowerTable = (): void => {
  try {
    db.execAsync(
      `CREATE TABLE IF NOT EXISTS power_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine TEXT,
        timestamp TEXT,
        power_value REAL
      )`
    ).then(() => console.log('✅ Power table is ready'))
      .catch((err: Error) => console.error('❌ Failed to create power_logs table:', err));
  } catch (err) {
    console.error('❌ SQLite setup error:', err);
  }
};

// Save an array of logs to SQLite
export const savePowerLogsToSQLite = async (logs: PowerLog[]) => {
  try {
    await db.execAsync('DELETE FROM power_logs');

    const insertSQL = 'INSERT INTO power_logs (machine, timestamp, power_value) VALUES (?, ?, ?)';

    for (const item of logs) {
      await db.runAsync(insertSQL, [item.machine, item.timestamp, item.power_value]);
    }

    console.log(`✅ Saved ${logs.length} logs to SQLite`);
  } catch (error: unknown) {
    console.error('❌ Failed to save power logs to SQLite:', error);
  }
};

// Fetch logs by machine and date (24h range)
export const getPowerLogsFromSQLite = async (
  machine: string,
  date: string,
  callback: (results: PowerLog[]) => void
): Promise<void> => {
  try {
    const start = `${date}T00:00:00`;
    const end = `${date}T23:59:59`;

    const result = await db.getAllAsync<PowerLog>(
      `SELECT * FROM power_logs WHERE machine = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp ASC`,
      [machine, start, end]
    );

    callback(result);
  } catch (err: unknown) {
    console.error('❌ SQLite fetch error:', err);
    callback([]);
  }
};




