# Changelog

All notable changes to the Sage VS Code extension are documented here.

## [0.3.0]

### Changed
- Contribute the Sage image as a language icon and remove the standalone Sage
  file icon theme. Existing icon themes, including Material Icon Theme, stay active.
- Document file icon precedence and optional Material Icon Theme associations.
- Handle quoted compiler paths and report nonzero compiler exit codes in the Test
  Explorer and Run Current File output.

## [0.2.0]

### Added
- **Test Explorer integration**: discovers `*.test.sg` files and runs them through
  the Sage compiler, surfacing each `[PASS]`/`[FAIL]` assertion as a test result in
  the VS Code Testing view.
- **"Sage: Run Current File"** command that compiles and runs the active `.sg` file,
  streaming output to the "Sage" output channel.
- Settings: `sage.command` (how to invoke the compiler) and `sage.testGlob`
  (test-file discovery pattern).

### Changed
- Grammar updated for the language's memory-safety and FFI features: `unsafe`,
  `new`, `delete`, `struct`, `extern`, `type`, and the C interop type aliases
  (`c_int`, `c_char`, `c_size_t`, `c_void`, ...).

## [0.1.0]

### Added
- Initial syntax highlighting, language configuration, and file icons for Sage.
