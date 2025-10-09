import express, { Request, Response } from "express";
import { initDb } from "./database.ts";
import db from "./database.ts";
import { DeviceDataSchema, BuildingUpdateSchema } from "./schemas.ts";

initDb();

const app = express();
const port = 8000;

app.use(express.json());

app.get("/api/v0/data", (req: Request, res: Response) => {
  const { timeRange, building } = req.query;

  let startTime = new Date();
  startTime.setDate(startTime.getDate() - 14); // Default to 2 weeks

  if (typeof timeRange === 'string') {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    if (!isNaN(value)) {
      switch (unit) {
        case "h":
          startTime = new Date(Date.now() - value * 60 * 60 * 1000);
          break;
        case "d":
          startTime = new Date(Date.now() - value * 24 * 60 * 60 * 1000);
          break;
        case "w":
          startTime = new Date(Date.now() - value * 7 * 24 * 60 * 60 * 1000);
          break;
        case "y":
          startTime = new Date(Date.now() - value * 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }
  }

  let query = "SELECT * FROM readings WHERE timestamp >= ?";
  const params: any[] = [startTime.toISOString()];

  if (typeof building === 'string') {
    query += " AND sensor_id IN (SELECT id FROM sensors WHERE building_id = ?)";
    params.push(building);
  }

  const getReadingsStmt = db.prepare(query);
  const readings = getReadingsStmt.all(...params);

  res.json(readings);
});

app.get("/api/v0/buildings", (req: Request, res: Response) => {
  const getBuildingsStmt = db.prepare(`
    SELECT
      b.id,
      b.name,
      COUNT(DISTINCT d.id) as device_count,
      COUNT(DISTINCT s.id) as sensor_count
    FROM
      buildings b
    LEFT JOIN
      devices d ON b.id = d.building_id
    LEFT JOIN
      sensors s ON b.id = s.building_id
    GROUP BY
      b.id, b.name;
  `);

  const buildings = getBuildingsStmt.all();
  res.json(buildings);
});

app.post("/api/v0/data", (req: Request, res: Response) => {
  const validationResult = DeviceDataSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error });
  }

  const { temperature, humidity, device_id, sensor_id } = validationResult.data;

  // For now, assume device and sensor exist.
  // Later, I will add logic to create them if they don't.

  const insertReadingStmt = db.prepare(
    "INSERT INTO readings (sensor_id, temperature, humidity) VALUES (?, ?, ?)",
  );
  insertReadingStmt.run(sensor_id, temperature, humidity);

  res.status(201).json({ message: "Data received" });
});

app.put("/api/v0/buildings", (req: Request, res: Response) => {
  const validationResult = BuildingUpdateSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error });
  }

  const { id, name } = validationResult.data;

  const updateBuildingStmt = db.prepare("UPDATE buildings SET name = ? WHERE id = ?");
  const result = updateBuildingStmt.run(name, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Building not found" });
  }

  res.json({ message: "Building updated" });
});

if (import.meta.main) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export { app };
