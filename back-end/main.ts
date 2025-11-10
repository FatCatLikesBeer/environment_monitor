import { Context, Hono, Next } from "hono";
import ctrl from "./controllerFunctions/index.ts";

const app = new Hono();

app.get("/", ctrl.get_controllerIndex);
app.post("/api/v0/data");

Deno.serve({ port: 8000 }, app.fetch);
