import { Context, Hono, Next } from "hono";

const app = new Hono();

app.use("/", async (c: Context, next: Next) => {
  console.log(c.req.header());
  console.log(await c.req.text());
  await next();
});

app.get("/", (c: Context) => {
  return c.text("Hell oworld");
});

app.post("/", async (c: Context) => {
  const content = await c.req.text();
  console.log(Date());
  console.log(content);
  return c.text("Recieved");
});

Deno.serve({ port: 8000 }, app.fetch);
