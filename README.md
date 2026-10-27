# Sage Programming Language — VS Code Extension

Visual Studio Code support for the Sage programming language, a statically typed
language that transpiles to C11. The compiler and its current capabilities are
documented in the Sage compiler repository.

## Features

- **Syntax highlighting** for Sage (`.sg`) — keywords, memory and unsafe operations
  (`unsafe`, `new`, `delete`; the compiler requires `unsafe` for `new`/`delete`, S133), types (fixed-width + C interop aliases such as `c_int`,
  `c_size_t`, `c_void`), modules, namespaces, strings with interpolation, comments,
  borrows (`&T`, `&mut T`), native resources, extension methods, and `extern cpp` blocks.
- **Sage file icon** contributed as a language icon. Your chosen file icon theme
  remains active (see [File icons and Material Icon Theme](#file-icons-and-material-icon-theme)).
- **Run Current File** — the `Sage: Run Current File` command compiles and runs the
  active file, then writes output to the *Sage* output channel.
- **Problems panel** — compiler errors from Run Current File, Test Explorer and the build
  commands appear as editor squiggles and Problems entries, with the compiler's code,
  suggestion and related locations (see [Compiler diagnostics](#compiler-diagnostics)).
- **Build Project / Clean Build** — `Sage: Build Project` and `Sage: Clean Build` run
  `sage build` (the latter with `--clean`) for the project that contains the active file.
- **Graphify** — build the compiler-derived semantic index and ask for a symbol, its callers,
  or its ownership contract without reading whole files (see [Graphify](#graphify)).
- **Test Explorer** — `*.test.sg` files appear in the VS Code Testing view. Running them
  invokes the Sage compiler and reports each `[PASS]`/`[FAIL]` assertion as a test result.

## Commands

| Command | What it does |
|---------|--------------|
| `Sage: Run Current File` | Compile and run the active `.sg` file; errors go to Problems. |
| `Sage: Build Project` | Run `sage build` in the project that contains the active file. |
| `Sage: Clean Build` | Run `sage build --clean` (discards cached objects in `obj/` first). |
| `Sage: Graphify Build Index` | Run `sage graphify build` and report how many modules changed. |
| `Sage: Graphify Query` | Pick a query (symbol, references, callers, callees, contract, dependencies, module summary) and a name. |
| `Sage: Graphify Find Symbol` | Where is the symbol under the cursor (or a typed name) declared? |
| `Sage: Graphify Find Callers` | Call sites of a function. |
| `Sage: Graphify Show Contract` | Ownership and borrow contract of a function. |

A project is the nearest directory above the active file that contains `src/main.sg`. When the
active editor is outside a project, the workspace folders are checked next.

## Requirements

The Sage compiler must be available. **Sage 0.37.0 or newer is recommended**; the grammar
tracks the language as of Sage 0.37.3. Older compilers still run files and tests, and the
extension degrades gracefully:

| Feature | Needs Sage |
|---------|-----------|
| Run Current File, Test Explorer, highlighting | any version |
| Structured diagnostics (`--diagnostics json`) | 0.35.0 (older compilers use the human format) |
| Graphify commands | 0.35.2 |
| Clean Build, `sage.cleanBeforeRun` (`--clean`) | 0.36.2 |
| Building projects that use `extern cpp` (needs `g++` on PATH) | 0.30.0 |

Point the extension at the compiler with the `sage.command` setting:

```jsonc
{
  // On PATH:
  "sage.command": "sage",

  // Or via the .NET build output:
  "sage.command": "dotnet \"C:/path with spaces/Sage.dll\""
}
```

## File icons and Material Icon Theme

This extension is compatible with **Material Icon Theme** and does not register or activate
a file icon theme (`contributes.iconThemes` is intentionally absent, and a manifest test
guards that). Keep **Material Icon Theme** selected in VS Code. Sage provides its own language icon for `.sg` files;
VS Code displays it when the active file icon theme allows language icons and has
no more specific `.sg` or Sage association. If Material Icon Theme supplies its
own icon for `.sg`, that icon takes precedence. The extension never changes
`workbench.iconTheme` or your Material Icon Theme settings.

For a deliberate Material Icon Theme override, use that theme's documented
`material-icon-theme.files.associations` setting in your **user** settings and
choose an icon name supported by your installed theme. This is optional; it does
not require switching themes.

## Borrowing syntax (Sage 0.9.0+)

The grammar recognizes explicit shared and mutable function borrows:

```sage
struct Counter { value: i32; }
func read(counter: &Counter): i32 { return counter.value; }
func increment(counter: &mut Counter): none { counter.value++; }
```

Call these contracts with `read(&counter)` and `increment(&mut counter)`. In
Sage 0.9.0, parameters support borrows for the call duration and supported
scalar/struct values. Sage 0.9.1 also supports local bindings such as
`var view: &mut Counter = &mut counter;`: their loans remain live until the end
of the lexical scope, blocking conflicting source access. Sage 0.10.0 also permits
borrowing structs containing fixed arrays of copyable values. Direct array
borrows, field-stored/returned references, strings, and FFI borrows require later work.
See the compiler's `docs/borrowing.md` for exact guarantees.
The compiler performs semantic checks when invoked; the extension provides
highlighting and execution/Test Explorer integration rather than live analysis.

## Array values and compiler diagnostics (Sage 0.10.0)

Fixed-array bindings, whole-array assignment, and Sage value parameters copy
supported elements into independent storage. Mutating an array parameter no
longer changes the caller's array:

```sage
func change(values: i32[2]): none { values[0] = 9; }
func main(): none
{
    var values: i32[2] = { 1, 2 };
    change(values); // values[0] remains 1.
}
```

Copyability is inferred for numeric/boolean values and recursively composed
structs and fixed arrays. Strings and native resources need further contracts.
Direct native `extern` calls require `unsafe` in Sage 0.11.0; their ABI remains trusted. See the compiler's
`docs/value-copy.md` for supported contexts, copy costs, and migration details.

Run Current File shows compiler and runtime diagnostics in the Sage output
channel. Test Explorer marks a file as errored when the compiler or executed
application returns a nonzero status. Relevant array diagnostics include:

| Code | Meaning |
|------|---------|
| S146 | Allocation must directly initialize a local owning binding |
| S164 | Native or unsafe Sage call needs an explicit unsafe context |
| S181 | Wrong struct field or array element type |
| S185 | Literal array index outside the declared range |
| S186 | Dynamic array index outside the range during execution |
| S188 | Unsupported array copy context or element layout |
| S189 | Bind the returned containing struct locally before indexing its array field |

Successful tests still report each `[PASS]`/`[FAIL]` assertion. These diagnostics
are produced when the compiler runs; this extension does not claim live checks.

## Native call migration (Sage 0.11.0)

Direct calls to functions declared in `extern` now require a local unsafe block
or an `unsafe func`. The grammar already highlights both forms:

```sage
extern native("stdlib.h") { func abs(value: c_int): c_int; }
func main(): none
{
    unsafe { var value: i32 = native::abs(-2) as i32; }
}
```

Ordinary console output retains its public API. Legacy `console.read_line` now
requires unsafe because its buffer has no capacity contract. Shell-based
`http_client.fetch`, `post`, and `download` also require unsafe because arguments are
interpolated without escaping. Those APIs remain available for explicit trusted
use; this release does not make their storage, transport, or resource lifetimes safe.
See compiler `docs/native-boundaries.md` for the migration and exact limits.

Unsafe contexts still enforce checked Sage ownership, borrowing, and fixed-array
bounds rules. When a boundary is missing, Run Current File displays `S164`, and
Test Explorer reports the compiler's nonzero result as a file error.

## Native resources (Sage 0.17.0)

The grammar highlights contextual resource names, native types, and destructors,
including declarations split across lines:

```sage
extern native("stdio.h")
{
    type FILE;
    func fclose(value: FILE*): c_int;
    resource OwnedFile: FILE* drop fclose;
}
```

Sage 0.12.0 introduced validated declarations; 0.13.0 adds local owners. Inside
unsafe, the exact declared native pointer can directly initialize an owner with
`as OwnedFile`. The caller must establish exclusive ownership of a valid handle
or null. Initializing another local from a named owner moves it; the source
becomes unavailable. Scope exit releases non-null handles in reverse declaration
order, including early returns. Const owners also support moves and cleanup.

Implicit cleanup makes one destructor call and discards any integer status; it
does not retry or propagate failure. The destructor contract must consume the
handle even when it reports an error. Inside unsafe, `owner as FILE*` exposes a
temporary alias that the caller must not retain, release, or adopt independently.
Native validity and alias lifetimes remain trusted.

Sage 0.14.0 also supports `&OwnedFile` and `&mut OwnedFile` parameters and lexical
borrowed locals. Borrowing never adopts the handle. Active loans prevent owner
moves, mutable loans prevent competing access, and shared/const access cannot be
upgraded to mutable. Calls require explicit borrows and reject conflicting aliases
or effectful arguments alongside borrowed arguments. Resource borrows cannot be
moved into owners or returned. Existing borrow scopes and diagnostics apply.

```sage
func is_empty(value: &OwnedFile): b8
{
    return value == null;
}
```

The wrapper author must preserve shared/mutable access and the native handle's
validity. Raw aliases created inside unsafe are not lifetime checked.

Sage 0.17.0 supports safe `owner == null` / `owner != null` queries and their
symmetric forms on named resource owners and borrows. They return a boolean
without exposing a raw pointer or transferring ownership. Availability and loan
checks remain active. `null` is contextual when no binding with that name exists;
it does not construct a resource or introduce general raw-pointer null values.
Bind presence results before passing them alongside consumed arguments (S194),
including nested expressions. Invalid resource/null comparisons report S195.

Sage 0.15/0.16 adds owning returns and consuming resource parameters. A return
transfers a named local owner or owning parameter; its result must directly
initialize another local owner. A resource parameter by value consumes a named
owner from the caller. The callee adopts cleanup even if it never uses the value.
Returning or forwarding it clears the callee's source before cleanup.

```sage
func identity(value: OwnedFile): OwnedFile { return value; }
func consume(value: OwnedFile): none {}

func empty_file(): OwnedFile
{
    unsafe
    {
        var owner: OwnedFile = (0 as FILE*) as OwnedFile;
        return owner;
    }
}

func main(): none
{
    var first: OwnedFile = empty_file();
    var second: OwnedFile = identity(first);
    consume(second);
}
```

Neither source can be used after its move. A call cannot consume and borrow the
same resource in either argument order. Bind calls/mutations in other arguments
before a consuming call; C does not specify argument evaluation order. Callee
body locals are destroyed first, then owned parameters in reverse declaration
order. Entry points and native ABI declarations cannot accept resource values.

`S190` identifies invalid destructor/representation contracts; `S191` reports
resource operations that remain disabled; `S192` rejects unsupported adoption or
handle casts. `S193` requires a named returned owner and direct local binding of
an owning producer; `S194` requires named consuming arguments and rejects call
conflicts/effectful arguments. Resource globals, fields, arrays, and safe file
APIs are not enabled yet. See compiler `docs/native-resource-contracts.md`.
Ordinary variables named `resource` or `drop` retain identifier highlighting.

## Owned byte files (Sage 0.18.0)

`use byte_file;` imports `ByteFile` ownership and a bounded byte API. `is_open`
takes a shared borrow; `read_byte`, `write_byte`, `seek_start`, and `flush` take
mutable borrows. `close(owner)` consumes ownership and returns its native close
status as a boolean, including failure. The owner cannot be reused afterward.

```sage
use byte_file;

func write_marker(value: &mut ByteFile): b8
{
    var byte: u8 = 255;
    return byte_file::write_byte(&mut value, byte);
}
```

`ByteRead` returns `value`, `has_value`, and `failed`. Data has `has_value=true`;
clean EOF has both flags false; an empty handle or I/O failure has `failed=true`.
Read `value` only when `has_value` is true. All 256 byte values are supported.

Since Sage 0.20.0, `create_bytes(path: u8[260], length: u16)` safely creates/truncates
a binary file from 1..259 printable ASCII bytes. The selected prefix is validated
before native open; embedded zero, controls, non-ASCII, and invalid lengths return
an empty owner. Remaining array bytes are ignored; no terminator is needed.

```rust
var path: u8[260] = { 97, 46, 98, 105, 110 }; // a.bin
var length: u16 = 5;
var owner: ByteFile = byte_file::create_bytes(path, length);
var closed: b8 = byte_file::close(owner);
```

S188 rejects casts that fabricate a fixed array or turn one into a non-pointer
value. Use an array literal or checked copy. Explicit array-to-pointer casts for
native interop still require unsafe (S122).

`create(path: str)` remains **unsafe** and creates/truncates a binary file: legacy
strings have unchecked native lifetimes. Creation failure returns an empty owner.
`empty()` needs no unsafe context. Existing unsafe `file` wrappers are unchanged.
Implicit cleanup closes best-effort; use consuming `close` when its result matters.
This is not a complete safe text/path or buffer API. The project's `std` directory
contains only `.sg` sources. Native support ships beside `Sage.dll` in
`Runtime/include`; see compiler `docs/byte-files.md`.

Since Sage 0.19.0, use `http_client.sg` / `use http_client;` and `http_server.sg` /
`use http_server;`. Update qualified calls to `http_client::...` and
`http_server::...`; the old `http` and `server` imports report S007.

Run Current File and Test Explorer retain native I/O results and ownership errors,
including S164 for unsafe acquisition and S140 for reuse after consuming close.

Since Sage 0.22.0, `byte_file` imports `byte_buffer` and provides bounded block
transfers. Include both `.sg` modules in local std distributions.

| Call | Borrow contract | Result |
| --- | --- | --- |
| `read_buffer(&mut file, &mut buffer, limit)` | Exclusive file and target | Replaces initialized contents with received bytes, bounded by capacity |
| `write_buffer(&mut file, &buffer, limit)` | Exclusive file, shared source | Writes an initialized prefix, bounded by length |

Both return `ByteTransfer { count: u32; eof: b8; failed: b8; }`. Count remains
meaningful on partial failure. A clean EOF may include bytes; an exact read does
not predict EOF. Once native input starts, target length becomes count, including
zero at EOF/error, and old suffix bytes are hidden. Invalid owners/limits and
positioning failures preserve the target. Zero limit for a permitted operation
with valid owners is a no-op that preserves contents and does not probe EOF.

Writes preserve the source and always return `eof=false`. A short write is a
failure; transferred bytes are not rolled back. Successful output can remain
buffered, so check flush and consuming close separately. There is no automatic
retry after native errors. See compiler `docs/byte-files.md` for the full contract.

Since Sage 0.23.0, `open_read_bytes(path: u8[260], length: u16)` opens existing
binary input without truncating it. It uses the same bounded printable ASCII
prefix as `create_bytes`. Missing/unreadable files or invalid paths return an
empty owner; missing files are never created. The existing constructors keep
their creation/truncation behavior.

`can_write(&file)` reports the handle's acquired mode, preserved through moves and
owning returns. It is false for read-only and empty owners and does not guarantee
OS permissions or future I/O success. Read-only handles permit byte/block reads,
positioning and consuming close. They reject `write_byte` and `flush` with false;
`write_buffer` returns count=0, eof=false, failed=true, even for zero limit.
These are runtime mode checks on the existing `ByteFile` resource type. Rejected
output never reaches native stdio or changes input position.

General append/update modes and Unicode paths remain unfinished. Native support
stays with the compiler in `Runtime/include`; std contains only `.sg` sources.

## Owned byte buffers (Sage 0.21.0)

`use byte_buffer;` provides exclusive `ByteBuffer` owners with fixed `u32`
capacity and a separately tracked initialized length. Creation, reads and
mutation require no raw pointers or legacy strings.

```rust
use byte_buffer;

func example(): b8
{
    var capacity: u32 = 4;
    var owner: ByteBuffer = byte_buffer::create(capacity);
    var byte: u8 = 42;
    var pushed: b8 = byte_buffer::push(&mut owner, byte);
    var index: u32 = 0;
    var read: BufferRead = byte_buffer::read(&owner, index);
    byte_buffer::release(owner);
    return pushed && read.has_value && read.value == 42;
}
```

`read` borrows shared storage and returns `BufferRead { value, has_value }`.
`write` replaces an initialized position; `push` appends within capacity;
`clear` resets length while retaining storage. These mutations require `&mut`.
Unavailable reads return `has_value=false` / `value=0`; failed writes and pushes
preserve contents and length. Spare capacity and cleared bytes are unreadable.
Clear does not securely erase storage. All 256 byte values are supported.

`create(0)` is a valid allocated owner. Allocation failure returns an empty owner;
use `is_allocated(&owner)` or `owner != null`. Empty owners report zero length/
capacity and fail read/write/push safely. `release` consumes a named owner; scope
cleanup also frees storage. S140 rejects reuse after release/move, S171 rejects
shared mutation, and S178 rejects consumption during a live loan.

Native support ships in compiler `Runtime/include`; std remains Sage-only.
Resizing, slices and general owned strings remain future work. See
compiler `docs/byte-buffers.md` and `Sandbox/examples/owned_byte_buffer.sg`.

## Native resource replacement (Sage 0.24.0)

A standalone `destination = source;` assignment between available local owners
of the same native resource type transfers the source and destroys the old
destination handle once. The compiler rejects self-assignment, borrowed sources,
conflicting live borrows, and later use of the moved source. The extension's
Run Current File and Test Explorer commands surface those compiler diagnostics;
they do not perform ownership analysis in the editor.

See the compiler's `docs/native-resource-contracts.md` and
`tests/native-resource-reassignment.ps1` for the exact contract and validation.

## Local resource structs (Sage 0.25.0–0.30.0)

A local struct literal may move named native resource owners into its direct
fields. The compiler releases those fields in reverse declaration order on
scope exit or early return. Since Sage 0.26.0, a local struct may also contain
another resource struct declared earlier in the same source file. Nested literals
receive recursive reverse-field cleanup. Omitted fields remain empty. Whole-struct
copies, pointers to these structs, calls, and returns remain unsupported
and produce S196. Since Sage 0.29.0, a standalone assignment from a named
resource owner can replace a direct resource field of a mutable local struct;
the old field is released and the source is moved. Since Sage 0.30.0, the same
contract applies through nested local struct fields. Array-element field
replacement remains unsupported. The extension highlights the existing
struct syntax and displays compiler errors through Run Current File and Test
Explorer.

See the compiler's `docs/resource-structs.md` for the supported subset. The
Sage language icon continues to coexist with the active Material Icon Theme.

## Local resource arrays (Sage 0.27.0–0.28.0)

A fixed local array may move named native resource owners from a literal and
automatically release its nonempty elements in reverse index order. Whole-array
copies, element extraction, parameters, and returns remain unsupported. Since
Sage 0.28.0, same-file resource structs can also be stored in local fixed
arrays using direct element literals or zero initialization. Cleanup recursively
releases their fields in reverse order. The extension displays the compiler's
S196/S197 diagnostics through Run Current File and Test Explorer; it does not enforce ownership in
the editor. See the compiler's `docs/resource-arrays.md` for details.

## C++ interop and native sources (Sage 0.30.0–0.31.0)

The grammar highlights `extern cpp` blocks, `class` handle declarations, and
`source` entries. These words stay ordinary identifiers elsewhere, and a C block
named `cpp` keeps its usual highlighting.

```sage
extern cpp lib("tally.hpp")
{
    source "tally.cpp";
    class Tally = lib::Tally;
    func create(start: c_int): Tally* = new;
    func add(tally: Tally*, amount: c_int): c_int = .add;
    func destroy(tally: Tally*): none = delete;
    resource OwnedTally: Tally* drop destroy;
}
```

The compiler generates `extern "C"` adapters and builds declared `.c`/`.cpp`
sources; projects with C++ need `g++` next to `gcc` on PATH. Run Current File and
Test Explorer show adapter, S210 contract, and S211 source diagnostics as compiler
errors. See the compiler's `docs/cpp-interop.md` for the supported subset.

Inside an `extern cpp` block the grammar also scopes binding targets: qualified names
(`= demo::add`), quoted template targets (`= "demo::biggest<int>"`), `= new`, `= delete`,
member calls (`= .increment`), the trailing contextual `catch` of recoverable bindings
(`= safe::divide catch`, `= new catch`, `= .take catch`) and the failure queries
`= catch` and `= catch.message` (Sage 0.31.1). `catch` stays an ordinary identifier outside
these bindings.

## Extension methods (Sage 0.34.1)

The grammar highlights the contextual `method` modifier before `func` (`method func`,
`unsafe method func`) and scopes `value.name(args)` as a method call, distinct from the
field access `value.name`. `method` stays an ordinary identifier everywhere else.

```sage
module counter
{
    method func read(value: &Counter): i32 { return value.count; }
    method func bump(value: &mut Counter, amount: i32): none { value.count = value.count + amount; }
}

func main(): none
{
    var c: Counter = { count = 1 };
    c.bump(4);                 // counter::bump(&mut c, 4)
    var total: i32 = c.read(); // method call; c.count would be a field access
}
```

Resolution is compile-time: `S156`–`S159` report missing, ambiguous, or non-`method`
candidates. See the compiler's `docs/extension-methods.md`.

## Compiler diagnostics

The extension never analyzes Sage code itself; it presents what the compiler reports.
After **Run Current File**, a Test Explorer run, **Build Project** or **Clean Build**, the
compiler's errors are published to the Problems panel (source `sage`, with the `Sxxx` code).

- With Sage 0.35.0 or newer the extension passes `--diagnostics json`, so each Problem keeps the
  absolute file path, the line and column, the suggestion (when the compiler has a reliable
  one), and related locations such as the operation that moved an owner (`S140`–`S142`).
- Older compilers print `file(line,col): error CODE: message`; the extension parses that
  format instead. `sage.diagnosticsFormat` forces either behavior (`auto`, `json`, `human`).
- The Sage output channel always shows the human format, so the text reads the same either way.
- Test Explorer still reports each `[PASS]`/`[FAIL]` assertion; a compile error marks the file
  as errored and links to the first diagnostic.

For your own `tasks.json`, the extension contributes the `$sage` problem matcher for the human
format. File names in that format are relative to the `src` directory of the workspace folder:

```jsonc
{
  "label": "sage build",
  "type": "shell",
  "command": "sage build",
  "problemMatcher": "$sage"
}
```

New compiler codes arrive with the language: `S133` (`new`/`delete` outside `unsafe`), `S153`
(callable not directly imported), `S156`–`S159` (methods), `S210`–`S213` (native interop).
The compiler's `docs/diagnostics.md` lists every code with its rule.

## Graphify

Graphify is the compiler's deterministic semantic index (modules, `use` dependencies,
functions with ownership contracts, structs, resources, calls). It costs nothing to run and
returns focused answers rather than whole files. The index lives in the project's
`obj/graphify/`.

- **Graphify Build Index** refreshes it and reports how many modules were updated.
- **Graphify Query** asks for a symbol, references, callers, callees, contract, dependencies,
  or a module summary. **Find Symbol**, **Find Callers** and **Show Contract** are shortcuts.
  The name defaults to the symbol under the cursor, including qualified names such as
  `geometry::shift` and fields such as `Point.x`.
- Answers with locations open in a pick list that jumps to the source (a single result opens
  directly). Contracts, dependencies and module summaries print in the *Sage* output channel.
- Every query refreshes the index first. If the project does not compile, the answer comes
  from the last good index, a warning says so, and the errors appear in Problems.

Std-library locations (`std/<name>.sg`) are listed but cannot be opened unless the file exists
in the project. See the compiler's `docs/graphify.md`.

## Build options

`Sage: Build Project` runs `sage build`; `Sage: Clean Build` adds `--clean`, which deletes the
incremental cache and objects in `obj/` before building (Sage 0.36.2 and newer; see the
compiler's `docs/incremental-build.md`). Set `sage.cleanBeforeRun` to also pass `--clean` on
every Run Current File and Test Explorer run.

## Writing tests

Tests are ordinary Sage programs that use the `test` standard-library module and print
`[PASS]`/`[FAIL]` lines. Name the file `<name>.test.sg`:

```rust
use test;

func main(): none
{
    test::assert_eq_i32("add", 2 + 3, 5);
    test::assert_true("truth", 1 < 2);
}
```

Open the **Testing** view and press *Run* — each assertion shows up as an individual result.

## Settings

| Setting                  | Default          | Description                                                                 |
|--------------------------|------------------|-----------------------------------------------------------------------------|
| `sage.command`           | `sage`           | Command used to invoke the compiler (path or launcher).                     |
| `sage.testGlob`          | `**/*.test.sg`   | Glob used to discover test files.                                           |
| `sage.diagnosticsFormat` | `auto`           | `auto` uses `--diagnostics json` when the compiler supports it (0.35.0+); `json` forces it; `human` parses the human format. |
| `sage.cleanBeforeRun`    | `false`          | Pass `--clean` on Run Current File and Test Explorer runs (Sage 0.36.2+).   |

## Development

The extension source is published in
[`TheSampaio/SageExtensionCode`, branch `codex/sage-extension`](https://github.com/TheSampaio/SageExtensionCode/tree/codex/sage-extension).
The existing `main` contains the outer workspace wrapper with an independent
history. Clone the source branch directly for development; do not add the nested
local checkout to the wrapper as a Git submodule/gitlink.

This extension is authored in plain JavaScript, so it runs without a build step.
Press `F5` in VS Code to launch an Extension Development Host.
Run `npm test` for the grammar (tokenized with the VS Code regex engine), diagnostics and
Graphify parsing, project discovery, process handling and manifest tests; none needs a VS Code
runtime. `npm run check` syntax-checks every JavaScript file.

Layout: `lib/` holds pure, VS Code-free helpers (unit-tested); `host/` and `commands/` hold
the code that touches the VS Code API; `extension.js` wires them together.

Install development tools with `npm ci --ignore-scripts`, then run `npm run check`
and `npm run package` to produce a local VSIX. Development dependencies and tests
are excluded from that package. The Azure Identity dependency of the packaging
tool is fixed at 4.13.0 to stay on its supported MSAL 3 line; later Identity
versions currently pull the MSAL advisory GHSA-xcx6-jx8p-x3h5. Recheck this pin
when upgrading the packaging tool. Its MSAL dependency uses only `uuid.v4()`;
the compatible CommonJS UUID 11.1.1 override avoids GHSA-w5hq-g745-h8pq.

## License

[MIT](./LICENSE) © Kellvyn Sampaio
