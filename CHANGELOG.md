# Changelog

All notable changes to the Sage VS Code extension are documented here.

## [0.9.0]

### Changed
- Document Sage 0.21.0 owned byte buffers: checked initialized-prefix reads,
  exclusive bounded mutation, allocation failure, and consuming release.
- Explain ownership diagnostics and remaining slice, resize, text and bulk-I/O
  boundaries. Preserve language icons and Material Icon Theme coexistence.

## [0.8.0]

### Changed
- Document Sage 0.19/0.20: `http_client` / `http_server`, Sage-only std directories,
  and compiler-owned native support in `Runtime/include`.
- Document safe bounded ASCII file acquisition with `create_bytes`, its exact
  limits and failure behavior, and S188/S122 array-cast diagnostics.
- Retain language file icons and coexistence with Material Icon Theme.

## [0.7.0]

### Changed
- Document Sage 0.18.0 owned byte files: borrowed byte I/O, explicit EOF/failure,
  positioning/flush, and consuming close with status.
- Preserve the explicit unsafe path-acquisition boundary and the legacy file API.
- Explain shipping the native std header and ownership diagnostics for close.

## [0.6.2]

### Fixed
- Correct the repository metadata to the user-confirmed `TheSampaio/SageExtensionCode`.
- Document the independent extension source branch `codex/sage-extension` while
  preserving the repository's existing wrapper history on `main`.

## [0.6.1]

### Changed
- Document Sage 0.17.0 safe resource null comparisons, contextual name shadowing,
  S195 boundaries, and prior local evaluation in consuming calls.
- Update the resource presence example to use safe Sage and validate contextual
  null tokenization with the actual TextMate/Oniguruma engine.

## [0.6.0]

### Changed
- Document Sage 0.15/0.16 owning resource returns and consuming parameters,
  direct producer binding, named consuming arguments, and S193/S194 diagnostics.
- Explain caller invalidation, callee cleanup, parameter destruction order,
  same-call ownership/borrow conflicts, and stable argument requirements.
- Preserve the active file icon theme and the native unsafe/aggregate limits.

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
