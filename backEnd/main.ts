import { type Context, Hono } from "hono";

const app = new Hono();

// Init
// Middleware
// Monitor Routing
// Client routing
app.get("/", (c: Context) => {
  return c.text("Hello there!");
});

Deno.serve(app.fetch);
