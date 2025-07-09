// utils/machineDB.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('machine_data.db');

export const setupMachineDB = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      date TEXT,
      spindle_speed REAL,
      rest_time INTEGER,
      power_consumption REAL,
      status TEXT
    );
  `);
};

export const saveMachineDataOffline = async (
  name: string,
  date: string,
  spindle_speed: number,
  rest_time: number,
  power_consumption: number,
  status: string
) => {
  await db.runAsync(
    `INSERT OR REPLACE INTO machines (name, date, spindle_speed, rest_time, power_consumption, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, date, spindle_speed, rest_time, power_consumption, status]
  );
};

export const getMachineDataOffline = async (name: string, date: string): Promise<any | null> => {
  const row = await db.getFirstAsync<Record<string, any>>(
    `SELECT * FROM machines WHERE name = ? AND date = ?`,
    [name, date]
  );

  return row ?? null;
};
