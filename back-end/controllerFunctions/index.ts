import * as DataBase from "node:sqlite";
import { Context } from "hono";

const db = new DataBase.DatabaseSync("db.sqlite3");

// Init DB
db.exec(`
  CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sensors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building INTEGER,
    device TEXT NOT NULL,
    sensor_id INTEGER,
    FOREIGN KEY (building) REFERENCES buildings(id),
    FOREIGN KEY (device) REFERENCES devices(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor TEXT NOT NULL,
    time INTEGER,
    temperature REAL,
    hunidity REAL,
    vpd REAL,
    FOREIGN KEY (sensor) REFERENCES sensors(id)
  );
`);

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
  // TODO: SQL syntax: device should select `devices` member based on device_id
  // TODO: Ignore if exists, insert device_id
  const db_insertPrepare = db.prepare(`
    INSERT INTO readings (device, sensor, temperature, humidity, time, vpd) VALUES (?, ?, ?, ?, ?);
  `);

  try {
    const request: DeviceRequestBody = await c.req.json();
    const formatted = { ...request, date: Date.now() };

    // Insert into DB
    for (const i in formatted.data) {
      const vpd = getVPD(
        formatted.data[i].temperature,
        formatted.data[i].humidity,
      );

      db_insertPrepare.run(
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
  } finally {
    db.close();
  }

  return errorFlag ? c.text("Unknown Error", 500) : c.text("Recieved!", 200);
};

export default {
  get_controllerIndex,
  post_insertReadings,
};

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
