import * as DataBase from "node:sqlite";
import { Context } from "hono";

const db = new DataBase.DatabaseSync("db.sqlite3");

// Init DB
db.exec(`
  CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_name TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_name TEXT NOT NULL UNIQUE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sensors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER,
    device_id TEXT NOT NULL,
    sensor_name TEXT NOT NULL,
    FOREIGN KEY (building_id) REFERENCES buildings(id),
    FOREIGN KEY (device_id) REFERENCES devices(id),
    UNIQUE (device_id, sensor_name)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER NOT NULL,
    time INTEGER,
    temperature REAL,
    humidity REAL,
    vpd REAL,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id)
  );
`);

// DB prepared statements

/**
 * Front end goes here
 */
export const get_controllerIndex = (c: Context): Response => {
  return c.text("Front end goes here", 200);
};

/**
 * Takes request body, parses and adds to database
 */
export const post_insertReadings = async (c: Context): Promise<Response> => {
  let errorFlag = true;

  try {
    const request: DeviceRequestBody = await c.req.json();
    const formatted = { ...request, date: Date.now() };

    // Insert device
    db.prepare(`INSERT OR IGNORE INTO devices(device_name) VALUES(?);`)
      .run(formatted.device_id);

    // Insert Sensors
    for (const i in formatted.data) {
      db.prepare(`
        INSERT OR IGNORE INTO sensors(device_id, sensor_name)
        VALUES((SELECT id FROM devices WHERE device_name = ?), ?);`)
        .run(formatted.device_id, formatted.data[i].name);
    }

    // Insert readings into DB
    for (const i in formatted.data) {
      const vpd = getVPD(
        formatted.data[i].temperature,
        formatted.data[i].humidity,
      );

      db.prepare(`
        INSERT INTO readings (sensor_id, temperature, humidity, time, vpd)
        VALUES(
          (SELECT id FROM sensors WHERE device_id =
            (SELECT id FROM devices WHERE device_name = ?)
          AND sensor_name = ?),
          ?, ?, ?, ?);
      `)
        .run(
          formatted.device_id,
          formatted.data[i].name,
          formatted.data[i].temperature,
          formatted.data[i].humidity,
          formatted.date,
          vpd,
        );
    }

    errorFlag = false;
  } catch (err: unknown) {
    console.error("err", err);
  }

  return errorFlag ? c.text("Unknown Error", 500) : c.text("Recieved!", 200);
};

export default {
  get_controllerIndex,
  post_insertReadings,
};

////////////////////////
// HELPER FUNCTIONS
////////////////////////

/**
 * Calculates VPD
 * @param {number} temperature - Temp in F°
 * @param {number} humidity
 */
function getVPD(temperature: number, humidity: number): number {
  const c = (temperature - 32) / 1.8;
  const svp = 0.61078 * Math.E ** ((17.27 * c) / (c + 237.3)); // Tetens equation
  const vpd = svp * (1 - humidity / 100);
  return vpd;
}

// TODO: BUILDINGS: POST API
