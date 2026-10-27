"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { runProcess } = require("../lib/process");

test("captures stdout, stderr, combined output and the exit code", async () => {
  const script = "process.stdout.write('out'); process.stderr.write('err'); process.exit(3);";
  const result = await runProcess(process.execPath, ["-e", script]);
  assert.equal(result.code, 3);
  assert.equal(result.stdout, "out");
  assert.equal(result.stderr, "err");
  assert.ok(result.output.includes("out") && result.output.includes("err"));
});

test("runs in the requested working directory", async () => {
  const result = await runProcess(process.execPath, ["-e", "process.stdout.write(process.cwd())"], { cwd: __dirname });
  assert.equal(result.stdout, __dirname);
});

test("reports a program that cannot be launched instead of rejecting", async () => {
  const result = await runProcess("sage-program-that-does-not-exist", []);
  assert.equal(result.code, -1);
  assert.match(result.output, /Failed to launch Sage compiler/);
});

test("stops a program that exceeds the timeout", async () => {
  const result = await runProcess(process.execPath, ["-e", "setTimeout(() => {}, 30000)"], { timeoutMs: 200 });
  assert.equal(result.code, -1);
  assert.match(result.output, /did not finish within 200 ms/);
});
