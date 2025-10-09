import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db.sqlite");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      building_id INTEGER,
      FOREIGN KEY (building_id) REFERENCES buildings (id)
    );

    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      device_id TEXT,
      building_id INTEGER,
      FOREIGN KEY (device_id) REFERENCES devices (id),
      FOREIGN KEY (building_id) REFERENCES buildings (id)
    );

    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT,
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sensor_id) REFERENCES sensors (id)
    );
  `);
}

export default db;
