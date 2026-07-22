# Sage Programming Language — VS Code Extension

Official Visual Studio Code support for the [Sage programming language](https://github.com/) —
a statically typed, memory-safe language that transpiles to C11.

## Features

- **Syntax highlighting** for Sage (`.sg`) — keywords, the memory-safety keywords
  (`unsafe`, `new`, `delete`), types (fixed-width + C interop aliases such as `c_int`,
  `c_size_t`, `c_void`), modules, namespaces, strings with interpolation, and comments.
- **File icons** for `.sg` files (enable the *Sage Icons* icon theme).
- **Run Current File** — the `Sage: Run Current File` command compiles and runs the
  active file, streaming output to the *Sage* output channel.
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
  "sage.command": "dotnet C:/path/to/Sage.dll"
}
```

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

## License

[MIT](./LICENSE) © Kellvyn Sampaio
