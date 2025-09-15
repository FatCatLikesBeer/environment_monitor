import * as SQLITE from "node:sqlite";

export const db = new SQLITE.DatabaseSync("./db.sqlite");

/**
 * initDB
 * Creates necessary tables
 */
export const dbInit = (): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS building(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER,
      name TEXT,
      description TEXT,
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS sensors(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id INTEGER,
      building_id INTEGER,
      location TEXT,
      offset_coefficient REAL,
      offset_constant REAL,
      FOREIGN KEY (building_id) REFERENCES building(id)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS sensor_data(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id INTEGER,
      time REAL,
      temperature INTEGER,
      humidity INTEGER,
      FOREIGN KEY (sensor_id) REFERENCES sensors(id)
    )
  `);
}
