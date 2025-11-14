import { Hono } from "hono";
import ctrl from "./controllerFunctions/index.ts";

const app = new Hono();

app.get("/", ctrl.get_controllerIndex);
app.post("/api/v0/data", ctrl.post_insertReadings);

Deno.serve({ port: 8000 }, app.fetch);
