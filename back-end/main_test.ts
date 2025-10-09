import { app } from "./main.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.202.0/assert/mod.ts";
import { Server } from "node:http";
import db from "./database.ts";

async function withServer(testFn: (port: number) => Promise<void>) {
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as any).port;

  try {
    await testFn(port);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function cleanDb() {
    db.exec("DELETE FROM readings");
    db.exec("DELETE FROM sensors");
    db.exec("DELETE FROM devices");
    db.exec("DELETE FROM buildings");
}

Deno.test("GET /api/v0/data returns empty array when no data", async () => {
  cleanDb();
  await withServer(async (port) => {
    const res = await fetch(`http://localhost:${port}/api/v0/data`);
    const json = await res.json();
    assertEquals(res.status, 200);
    assertEquals(json, []);
  });
});

Deno.test("POST /api/v0/data with valid data", async () => {
    cleanDb();
    db.exec("INSERT OR IGNORE INTO sensors (id) VALUES ('test-sensor')");

    await withServer(async (port) => {
        const data = {
            temperature: 25.5,
            humidity: 60.2,
            device_id: "test-device",
            sensor_id: "test-sensor",
        };

        const res = await fetch(`http://localhost:${port}/api/v0/data`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const json = await res.json();

        assertEquals(res.status, 201);
        assertEquals(json, { message: "Data received" });

        const reading = db.prepare("SELECT * FROM readings WHERE sensor_id = ?").get("test-sensor");
        assertExists(reading);
        assertEquals(reading.temperature, 25.5);
        assertEquals(reading.humidity, 60.2);
    });
});

Deno.test("POST /api/v0/data with invalid data", async () => {
    cleanDb();
    await withServer(async (port) => {
        const data = {
            temperature: "hot", // invalid type
            humidity: 60.2,
            device_id: "test-device",
            sensor_id: "test-sensor",
        };

        const res = await fetch(`http://localhost:${port}/api/v0/data`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        await res.json(); // Consume the response body to prevent leaks

        assertEquals(res.status, 400);
    });
});

Deno.test("GET /api/v0/buildings", async () => {
  cleanDb();
  db.exec("INSERT OR IGNORE INTO buildings (id, name) VALUES (1, 'Building A')");
  db.exec("INSERT OR IGNORE INTO buildings (id, name) VALUES (2, 'Building B')");
  db.exec("INSERT OR IGNORE INTO devices (id, building_id) VALUES ('device-1', 1)");
  db.exec("INSERT OR IGNORE INTO devices (id, building_id) VALUES ('device-2', 1)");
  db.exec("INSERT OR IGNORE INTO devices (id, building_id) VALUES ('device-3', 2)");
  db.exec("INSERT OR IGNORE INTO sensors (id, device_id, building_id) VALUES ('sensor-1', 'device-1', 1)");
  db.exec("INSERT OR IGNORE INTO sensors (id, device_id, building_id) VALUES ('sensor-2', 'device-1', 1)");
  db.exec("INSERT OR IGNORE INTO sensors (id, device_id, building_id) VALUES ('sensor-3', 'device-2', 2)");

  await withServer(async (port) => {
    const res = await fetch(`http://localhost:${port}/api/v0/buildings`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json, [
      { id: 1, name: "Building A", device_count: 2, sensor_count: 2 },
      { id: 2, name: "Building B", device_count: 1, sensor_count: 1 },
    ]);
  });
});

Deno.test("PUT /api/v0/buildings", async () => {
  cleanDb();
  db.exec("INSERT OR IGNORE INTO buildings (id, name) VALUES (3, 'Building C')");

  await withServer(async (port) => {
    // Test successful update
    const data = { id: 3, name: "Building C Updated" };
    const res = await fetch(`http://localhost:${port}/api/v0/buildings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json, { message: "Building updated" });

    const building = db.prepare("SELECT * FROM buildings WHERE id = ?").get(3);
    assertExists(building);
    assertEquals(building.name, "Building C Updated");

    // Test building not found
    const dataNotFound = { id: 999, name: "Building Not Found" };
    const resNotFound = await fetch(`http://localhost:${port}/api/v0/buildings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataNotFound),
    });
    const jsonNotFound = await resNotFound.json();

    assertEquals(resNotFound.status, 404);
    assertEquals(jsonNotFound, { error: "Building not found" });

    // Test invalid data
    const dataInvalid = { id: 3, name: 123 }; // name should be a string
    const resInvalid = await fetch(`http://localhost:${port}/api/v0/buildings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataInvalid),
    });
    await resInvalid.json();

    assertEquals(resInvalid.status, 400);
  });
});

Deno.test("GET /api/v0/data with timeRange", async () => {
  cleanDb();
  db.exec("INSERT OR IGNORE INTO sensors (id) VALUES ('time-sensor')");
  db.exec("INSERT INTO readings (sensor_id, temperature, humidity, timestamp) VALUES ('time-sensor', 20, 50, datetime('now', '-1 day'))");
  db.exec("INSERT INTO readings (sensor_id, temperature, humidity, timestamp) VALUES ('time-sensor', 21, 51, datetime('now', '-3 days'))");

  await withServer(async (port) => {
    // Test with timeRange=2d
    const res = await fetch(`http://localhost:${port}/api/v0/data?timeRange=2d`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.length, 1);
    assertEquals(json[0].temperature, 20);
  });
});

Deno.test("GET /api/v0/data with building", async () => {
  cleanDb();
  db.exec("INSERT OR IGNORE INTO buildings (id, name) VALUES (4, 'Building D')");
  db.exec("INSERT OR IGNORE INTO sensors (id, building_id) VALUES ('building-sensor-1', 4)");
  db.exec("INSERT OR IGNORE INTO sensors (id) VALUES ('building-sensor-2')");
  db.exec("INSERT INTO readings (sensor_id, temperature, humidity) VALUES ('building-sensor-1', 22, 52)");
  db.exec("INSERT INTO readings (sensor_id, temperature, humidity) VALUES ('building-sensor-2', 23, 53)");

  await withServer(async (port) => {
    // Test with building=4
    const res = await fetch(`http://localhost:${port}/api/v0/data?building=4`);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.length, 1);
    assertEquals(json[0].temperature, 22);
  });
});