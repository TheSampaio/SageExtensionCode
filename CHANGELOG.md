# Changelog

All notable changes to the Sage VS Code extension are documented here.

## [0.5.2]

### Changed
- Document Sage 0.14.0 shared/mutable native resource parameters and lexical
  borrows, reborrowing, and move/lifetime conflict diagnostics.
- Clarify that borrowing does not transfer ownership and that native operations
  inside wrappers still rely on reviewed unsafe contracts.

## [0.5.1]

### Changed
- Document Sage 0.13.0 local native resource adoption, moves, nullable scope
  cleanup, trusted raw-handle access, and S192 diagnostics.
- Keep the exact boundary explicit: resource borrows, value parameters/returns,
  fields, arrays, and safe file APIs are not enabled yet. Integer destructor
  status is discarded by single-attempt implicit cleanup.

## [0.5.0]

### Added
- Highlight Sage 0.12.0 contextual `resource ... drop ...` declarations, including
  multiline native types and destructor names.
- Real TextMate/Oniguruma regressions for declaration scopes, scope termination,
  contextual identifiers, strings, and comments.

### Changed
- Document declaration-only resource metadata and S190/S191 boundaries without
  claiming operational owned-resource cleanup.

## [0.4.3]

### Changed
- Document Sage 0.11.0 explicit unsafe native calls and legacy input/HTTP helper
  migration, including S146 allocation ownership and S164 call diagnostics.

## [0.4.2]

### Changed
- Document Sage 0.10.0 array value copies and borrowing of structs with copyable
  array fields, including the remaining lifetime and native ABI boundaries.
- Explain compiler/runtime failure reporting and array diagnostics in Run Current
  File and Test Explorer.

## [0.4.1]

### Added
- Document Sage 0.9.1 lexical borrow bindings and add a real-engine grammar
  regression for local `&T` / `&mut T` declarations and initializers.

## [0.4.0]

### Added
- Highlight explicit `&T`, `&mut T`, `&value`, and `&mut value` borrowing syntax
  introduced in Sage 0.9.0.
- Grammar tests using the VS Code TextMate and Oniguruma engines.

### Changed
- Scope imported module names as namespaces with explicit keyword/name captures.
- Keep `mut` contextual and distinguish borrowing from logical `&&`.

## [0.3.1]

### Changed
- Add a reproducible VSIX packaging command and lock development dependencies.
- Exclude development files and dependencies from the shipped extension.
- Remove the duplicate Sage prefix in the Run Current File command palette label.

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
