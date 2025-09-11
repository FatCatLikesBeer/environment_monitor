import { type Context, Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";

const app = new Hono();

// Middleware
app.use(trimTrailingSlash());

// Monitor Routes
app.post("/api/v0/monitorLog/:monitorId", (c: Context) => {
  return c.text("This endpoint may not return anything");
});
app.get("/api/v0/monitor/echo", (c: Context) => {
  return c.text("Endpoint requires an arbitrary call parameter");
});
app.get("/api/v0/monitor/echo/:call", (c: Context) => {
  const { call } = c.req.param();
  if (call) {
    return c.text(call);
  } else {
    return c.text("Endpoint requires an arbitrary call parameter", {
      status: 300,
    });
  }
})

// Client Routes
app.get("/", (c: Context) => {
  return c.text("User interface coming soon :)");
});

Deno.serve(app.fetch);
