# Sage Programming Language — VS Code Extension

Visual Studio Code support for the Sage programming language, a statically typed
language that transpiles to C11. The compiler and its current capabilities are
documented in the Sage compiler repository.

## Features

- **Syntax highlighting** for Sage (`.sg`) — keywords, the memory-safety keywords
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

## License

[MIT](./LICENSE) © Kellvyn Sampaio
