import * as DataBase from "node:sqlite";
import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import TIME from "../library/time.ts";

const db = new DataBase.DatabaseSync("db.sqlite3");

Deno.addSignalListener("SIGINT", () => {
  db.close();
  Deno.exit();
});

Deno.addSignalListener("SIGTERM", () => {
  db.close();
  Deno.exit();
});

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

db.exec("CREATE INDEX IF NOT EXISTS idx_readings_time ON readings(time);");

// DB prepared statements

/**
 * Front end goes here
 */
const get_controllerIndex = (c: Context): Response => {
  return c.text("Front end goes here", 200);
};

/**
 * Takes request body, parses and adds to database
 */
const post_insertReadings = async (c: Context): Promise<Response> => {
  let errorFlag = true;

  try {
    const request: DeviceRequestBody = await c.req.json();
    const formatted = { ...request, time: Date.now() };

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
          formatted.time,
          vpd,
        );
    }

    errorFlag = false;
  } catch (err: unknown) {
    console.error("Error", err);
  }

  return errorFlag
    ? c.text("Unknown Server Error", 500)
    : c.text("Recieved!", 201);
};

/**
 * Returns readings, defaulting a 2 week range
 */
const get_returnReadings = (c: Context) => {
  let status: ContentfulStatusCode = 500;
  let result: DatabaseQuerySelectReadings[] | string = "Unknown Server Error";

  try {
    const start = c.req.query("start") ?? (Date.now() - (TIME.WEEK * 2));
    const end = c.req.query("end") ?? Date.now();
    const invalidQueries: string[] = [];

    // Begin Guards
    if (13 != start.toString().length) invalidQueries.push("start");
    if (13 != end.toString().length) invalidQueries.push("end");
    if (invalidQueries.length) {
      status = 400;
      throw new Error(`Invalid queries: ${invalidQueries.join(", ")}`);
    }
    if (start > end) {
      status = 400;
      throw new Error("start can not be after end");
    }
    // End Guards

    const rows = db.prepare(`
      SELECT b.building_name as building, d.device_name as device, s.sensor_name as sensor,
        r.time, r.temperature, r.humidity, r.vpd
        FROM readings r
        JOIN sensors s ON r.sensor_id = s.id
        JOIN devices d ON s.device_id = d.id
        LEFT JOIN buildings b ON s.building_id = b.id
        WHERE r.time >= ? AND r.time <= ?;
    `).all(start, end) as unknown as DatabaseQuerySelectReadings[];

    result = rows;
    status = 200;
  } catch (err: unknown) {
    result = `${err}`;
    console.error("Error", err);
  }

  return c.json(result, status);
};

const get_return24HourRange = (c: Context) => {
  const oneDayAgo = Date.now() - TIME.DAY;
  let status: ContentfulStatusCode = 500;
  let result: string | string[] = "Unknown Server Error";

  try {
    const rows = db.prepare(`
      SELECT r.id, r.temperature, r.humidity, r.vpd, r.time, b.building_name as building,
        s.sensor_name as sensor
      FROM readings r
      JOIN sensors s ON r.sensor_id = s.id
      LEFT JOIN buildings b ON s.building_id = b.id
      WHERE time > ?
      AND r.temperature > 10;
    `).all(oneDayAgo) as unknown as {
      id: number;
      temperature: number;
      humidity: number;
      building: string | null;
      sensor: string;
      vpd: number;
    }[];

    const highLows: {
      [name: string]: {
        temperature: {
          high: number;
          average: number;
          low: number;
        };
        humidity: {
          high: number;
          average: number;
          low: number;
        };
        vpd: {
          high: number;
          average: number;
          low: number;
        };
      };
    } = {};

    const accumliator: {
      [name: string]: {
        temperature: number[];
        humidity: number[];
        vpd: number[];
      };
    } = {};

    rows.forEach((elem) => {
      const sensorName = elem.sensor;
      // Init properties
      if (!highLows[sensorName]) {
        highLows[sensorName] = {
          temperature: {
            high: -1000000,
            low: 1000000,
            average: 0,
          },
          humidity: {
            high: -1000000,
            low: 1000000,
            average: 0,
          },
          vpd: {
            high: -1000000,
            low: 1000000,
            average: 0,
          },
        };
        accumliator[sensorName] = {
          temperature: [],
          humidity: [],
          vpd: [],
        };
      }

      // Adjust Values
      if (highLows[sensorName].temperature.high < elem.temperature) {
        highLows[sensorName].temperature.high = elem.temperature;
      }
      if (highLows[sensorName].temperature.low > elem.temperature) {
        highLows[sensorName].temperature.low = elem.temperature;
      }
      if (highLows[sensorName].humidity.high < elem.humidity) {
        highLows[sensorName].humidity.high = elem.humidity;
      }
      if (highLows[sensorName].humidity.low > elem.humidity) {
        highLows[sensorName].humidity.low = elem.humidity;
      }
      if (highLows[sensorName].vpd.high < elem.vpd) {
        highLows[sensorName].vpd.high = elem.vpd;
      }
      if (highLows[sensorName].vpd.low > elem.vpd) {
        highLows[sensorName].vpd.low = elem.vpd;
      }

      // Push values in accumliator
      accumliator[sensorName].temperature.push(elem.temperature);
      accumliator[sensorName].humidity.push(elem.humidity);
      accumliator[sensorName].vpd.push(elem.vpd);
    });

    // Average out accumliator values
    Object.keys(accumliator).forEach((elem) => {
      const temps = (accumliator[elem].temperature.reduce((acc, curr) =>
        acc + curr, 0)) / accumliator[elem].temperature.length;
      const humes = (accumliator[elem].humidity.reduce((acc, curr) =>
        acc + curr, 0)) / accumliator[elem].humidity.length;
      const vpds = (accumliator[elem].vpd.reduce((acc, curr) =>
        acc + curr, 0)) / accumliator[elem].vpd.length;
      highLows[elem].temperature.average = temps;
      highLows[elem].humidity.average = humes;
      highLows[elem].vpd.average = vpds;
    });

    result = JSON.parse(JSON.stringify(highLows));
  } catch (error: unknown) {
    status = 400;
    result = `${error}`;
    console.error(error);
  }

  return c.json(result, status);
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

////////////////////////
// Export
////////////////////////

export default {
  get_controllerIndex,
  post_insertReadings,
  get_returnReadings,
  get_return24HourRange,
};
