"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseResults } = require("../lib/test-results");

test("reads passing and failing Sage assertions", () => {
  assert.deepEqual(parseResults("[PASS] add\r\n[FAIL] sum (expected 5, got 4)\n"), [
    { name: "add", passed: true, detail: "" },
    { name: "sum", passed: false, detail: "expected 5, got 4" }
  ]);
});

test("does not mistake compiler diagnostics for assertions", () => {
  assert.deepEqual(parseResults("main.sg(1,1): error S007: Missing module"), []);
});
