# Sage Programming Language — VS Code Extension

Visual Studio Code support for the Sage programming language, a statically typed
language that transpiles to C11. The compiler and its current capabilities are
documented in the Sage compiler repository.

## Features

- **Syntax highlighting** for Sage (`.sg`) — keywords, memory and unsafe operations
  (`unsafe`, `new`, `delete`), types (fixed-width + C interop aliases such as `c_int`,
  `c_size_t`, `c_void`), modules, namespaces, strings with interpolation, and comments.
- **Sage file icon** contributed as a language icon. Your chosen file icon theme
  remains active.
- **Run Current File** — the `Sage: Run Current File` command compiles and runs the
  active file, then writes output to the *Sage* output channel.
- **Test Explorer** — `*.test.sg` files appear in the VS Code Testing view. Running them
  invokes the Sage compiler and reports each `[PASS]`/`[FAIL]` assertion as a test result.

## Requirements

The Sage compiler must be available. Point the extension at it with the `sage.command`
setting:

```jsonc
{
  // On PATH:
  "sage.command": "sage",

  // Or via the .NET build output:
  "sage.command": "dotnet \"C:/path with spaces/Sage.dll\""
}
```

## File icons and Material Icon Theme

This extension does not register or activate a file icon theme. Keep **Material Icon
Theme** selected in VS Code. Sage provides its own language icon for `.sg` files;
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
`http.fetch`, `post`, and `download` also require unsafe because arguments are
interpolated without escaping. Those APIs remain available for explicit trusted
use; this release does not make their storage, transport, or resource lifetimes safe.
See compiler `docs/native-boundaries.md` for the migration and exact limits.

Unsafe contexts still enforce checked Sage ownership, borrowing, and fixed-array
bounds rules. When a boundary is missing, Run Current File displays `S164`, and
Test Explorer reports the compiler's nonzero result as a file error.

## Native resources (Sage 0.13.0)

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

`S190` identifies invalid destructor/representation contracts; `S191` reports
resource operations that remain disabled; `S192` rejects unsupported adoption or
handle casts. Resource borrows, value parameters/returns, globals, fields, arrays,
and safe file APIs are not enabled yet. See compiler `docs/native-resource-contracts.md`.
Ordinary variables named `resource` or `drop` retain identifier highlighting.

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

| Setting          | Default          | Description                                             |
|------------------|------------------|---------------------------------------------------------|
| `sage.command`   | `sage`           | Command used to invoke the compiler (path or launcher). |
| `sage.testGlob`  | `**/*.test.sg`   | Glob used to discover test files.                       |

## Development

This extension is authored in plain JavaScript, so it runs without a build step.
Press `F5` in VS Code to launch an Extension Development Host.
Run `npm test` to check command parsing, test output parsing, and the extension manifest.

Install development tools with `npm ci --ignore-scripts`, then run `npm run check`
and `npm run package` to produce a local VSIX. Development dependencies and tests
are excluded from that package. The Azure Identity dependency of the packaging
tool is fixed at 4.13.0 to stay on its supported MSAL 3 line; later Identity
versions currently pull the MSAL advisory GHSA-xcx6-jx8p-x3h5. Recheck this pin
when upgrading the packaging tool. Its MSAL dependency uses only `uuid.v4()`;
the compatible CommonJS UUID 11.1.1 override avoids GHSA-w5hq-g745-h8pq.

## License

[MIT](./LICENSE) © Kellvyn Sampaio
