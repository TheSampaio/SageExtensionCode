"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSageGrammar, scopesInLines } = require("./support/grammar");

let grammar;
test.before(async () => {
  grammar = await loadSageGrammar();
});

/** Scopes of `needle` on a single source line. */
function scopesAt(line, needle) {
  return scopesInLines(grammar, [line], 0, needle);
}

/** Returns a lookup of scopes by (row, needle) for a multi-line snippet. */
function lookup(lines) {
  return (row, needle) => scopesInLines(grammar, lines, row, needle);
}

test("highlights the contextual method modifier only before func", () => {
  const declaration = "method func read(value: &Counter): i32 {";
  assert.ok(scopesAt(declaration, "method").includes("storage.modifier.method.sage"));
  assert.ok(scopesAt(declaration, "func").includes("keyword.other.sage"));
  const unsafeDeclaration = "unsafe method func peek(value: &Counter): i32 {";
  assert.ok(scopesAt(unsafeDeclaration, "unsafe").includes("keyword.control.sage"));
  assert.ok(scopesAt(unsafeDeclaration, "method").includes("storage.modifier.method.sage"));
});

test("keeps method an ordinary identifier elsewhere", () => {
  const binding = scopesAt("var method: i32 = 1;", "method");
  assert.ok(binding.includes("variable.other.sage"));
  assert.ok(!binding.includes("storage.modifier.method.sage"));
  assert.ok(scopesAt("var total: i32 = method;", "method").includes("variable.other.sage"));
});

test("distinguishes extension method calls from field access", () => {
  const call = "var total: i32 = counter.read();";
  assert.ok(scopesAt(call, "read").includes("entity.name.function.method.sage"));
  assert.ok(scopesAt(call, "read").includes("meta.method-call.sage"));
  assert.ok(scopesAt(call, ".read").includes("punctuation.accessor.sage"));

  const field = scopesAt("var total: i32 = counter.count;", "count;");
  assert.ok(field.includes("variable.other.property.sage"));
  assert.ok(!field.some((scope) => scope.startsWith("entity.name.function")));

  assert.ok(scopesAt("c.bump(4);", "bump").includes("entity.name.function.method.sage"));
  assert.ok(scopesAt("total.doubled().plus(1);", "plus").includes("entity.name.function.method.sage"));
});

test("keeps qualified calls, plain calls and numbers unchanged", () => {
  assert.ok(scopesAt("counter::reset(&mut c);", "reset").includes("entity.name.function.sage"));
  assert.ok(scopesAt("counter::reset(&mut c);", "counter").includes("entity.name.namespace.sage"));
  assert.ok(scopesAt("start(1);", "start").includes("entity.name.function.sage"));
  assert.ok(scopesAt("var ratio: f64 = 1.5;", "1.5").includes("constant.numeric.sage"));
});

test("highlights method calls in interpolation but not in plain strings or comments", () => {
  assert.ok(scopesAt('var text: str = "n={c.read()}";', "read").includes("entity.name.function.method.sage"));
  assert.ok(!scopesAt('var text: str = "a.read()";', "read").includes("entity.name.function.method.sage"));
  assert.ok(scopesAt("// c.read()", "read").includes("comment.line.double-slash.sage"));
});

test("scopes extern cpp binding targets", () => {
  const at = lookup([
    'extern cpp geo("counter.hpp") {',
    "    class Counter = demo::Counter;",
    "    func add(a: c_int, b: c_int): c_int = demo::add;",
    '    func biggest(a: c_int, b: c_int): c_int = "demo::biggest<int>";',
    "    func create(start: c_int): Counter* = new;",
    "    func destroy(counter: Counter*): none = delete;",
    "    func increment(counter: Counter*, by: c_int): c_int = .increment;",
    "    resource OwnedCounter: Counter* drop destroy;",
    "}",
    "var after: i32 = 1;"
  ]);
  assert.ok(at(1, "class").includes("keyword.other.class.sage"));
  assert.ok(at(1, "Counter").includes("entity.name.type.class.sage"));
  assert.ok(at(1, "demo").includes("entity.name.namespace.sage"));
  assert.ok(at(2, "demo").includes("entity.name.namespace.sage"));
  assert.ok(at(2, "add;").includes("entity.name.function.sage"));
  assert.ok(at(2, "demo").includes("meta.binding-target.cpp.sage"));
  assert.ok(at(3, "demo::biggest").includes("string.quoted.double.target.sage"));
  assert.ok(at(4, "new").includes("keyword.control.sage"));
  assert.ok(at(5, "delete").includes("keyword.control.sage"));
  assert.ok(at(6, ".increment;").includes("punctuation.accessor.sage"));
  assert.ok(at(6, "increment;").includes("entity.name.function.member.sage"));
  assert.ok(at(7, "resource").includes("keyword.other.resource.sage"));
  assert.ok(at(7, "destroy").includes("entity.name.function.destructor.sage"));
  assert.ok(at(9, "after").includes("variable.other.sage"));
  assert.ok(!at(9, "after").includes("meta.extern.cpp.sage"));
});

test("scopes recoverable catch bindings and failure queries", () => {
  const at = lookup([
    'extern cpp safe("safe.hpp") {',
    "    func divide(a: c_int, b: c_int): c_int = safe::divide catch;",
    "    func open(limit: c_int): Gate* = new catch;",
    "    func take(gate: Gate*, n: c_int): c_int = .take catch;",
    "    func failed(): b8 = catch;",
    "    func reason(): str = catch.message;",
    "}"
  ]);
  assert.ok(at(1, "catch").includes("keyword.control.catch.sage"));
  assert.ok(at(1, "divide catch").includes("entity.name.function.sage"));
  assert.ok(at(2, "new").includes("keyword.control.sage"));
  assert.ok(at(2, "catch").includes("keyword.control.catch.sage"));
  assert.ok(at(3, "take catch").includes("entity.name.function.member.sage"));
  assert.ok(at(3, "catch").includes("keyword.control.catch.sage"));
  assert.ok(at(4, "catch").includes("keyword.control.catch.sage"));
  assert.ok(at(5, "catch").includes("keyword.control.catch.sage"));
  assert.ok(at(5, ".message").includes("punctuation.accessor.sage"));
  assert.ok(at(5, "message").includes("variable.other.property.sage"));
});

test("keeps catch an ordinary word outside extern cpp bindings", () => {
  const binding = scopesAt("var catch: i32 = 1;", "catch");
  assert.ok(binding.includes("variable.other.sage"));
  assert.ok(!binding.includes("keyword.control.catch.sage"));
});

test("supports source entries and borrows inside extern blocks", () => {
  const cpp = lookup([
    'extern cpp lib("tally.hpp") {',
    '    source "tally.cpp";',
    "    func peek(counter: &Counter): c_int;",
    "}"
  ]);
  assert.ok(cpp(1, "source").includes("keyword.other.source.sage"));
  assert.ok(cpp(1, "tally.cpp").includes("string.quoted.double.sage"));
  assert.ok(cpp(2, "&").includes("keyword.operator.borrow.sage"));

  const c = lookup(['extern native("stdio.h") {', '    source "report.c";', "}"]);
  assert.ok(c(1, "source").includes("keyword.other.source.sage"));
});

test("highlights borrowed receivers and method calls together", () => {
  const at = lookup([
    "module files {",
    "    method func is_open(value: &OwnedFile): b8 { return value != null; }",
    "    method func flush(value: &mut OwnedFile): b8 { return value.ready(); }",
    "}"
  ]);
  assert.ok(at(1, "method").includes("storage.modifier.method.sage"));
  assert.ok(at(1, "&").includes("keyword.operator.borrow.sage"));
  assert.ok(at(2, "mut").includes("storage.modifier.borrow.sage"));
  assert.ok(at(2, "ready").includes("entity.name.function.method.sage"));
});
