import { Hono } from "hono";
import ctrl from "./controllerFunctions/index.ts";

const app = new Hono();

app.get("/", ctrl.get_controllerIndex);
app.post("/api/v0/data", ctrl.post_insertReadings);
app.get("/api/v0/readings", ctrl.get_returnReadings);
app.get("/api/v0/readings/highlows", ctrl.get_return24HourRange);

Deno.serve({ port: 8000 }, app.fetch);
