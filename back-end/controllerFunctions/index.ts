import * as DataBase from "node:sqlite";
import { Context } from "hono";

const db = new DataBase.DatabaseSync("db.sqlite3");

// Define DB init here
// endif

export const get_controllerIndex = (c: Context): Response => {
  return c.text("Front end goes here", 200);
};

/**
 * Takes request body, parses and adds to database
 */
export const post_inserData = async (c: Context): Promise<Response> => {
  let errorFlag = true;
  const db_insertPrepare = db.prepare(`
    INSERT INTO readings (device_id, name, temp, humid, time) VALUES (?, ?, ?, ?, ?);
  `);

  try {
    const request: DeviceRequestBody = await c.req.json();
    const formatted = { ...request, date: Date.now() };

    // Insert into DB
    for (const i in formatted.data) {
      db_insertPrepare.run(
        formatted.device_id,
        formatted.data[i].name,
        formatted.data[i].temperature,
        formatted.data[i].humidity,
        formatted.date,
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
  post_inserData,
};
