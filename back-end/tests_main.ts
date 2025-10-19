import { assertEquals, assertExists } from "@std/assert";
import { add } from "./main.ts";

Deno.test(function addTest() {
  assertEquals(add(2, 3), 5);
});

Deno.test("My first test :)", function newTest() {
  assertExists("hello world");
  assertEquals<string>("hello world", "hello world");
});
