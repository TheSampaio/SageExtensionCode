# Native resource declarations — 2026-10-24

Validated extension 0.5.0 with compiler 0.12.0 (`99b8ac6`) in the user's existing
`D:/DevelopmentLibrary/Apps/Sage/Sandbox` VS Code window.

- JavaScript syntax checking and all 16 Node tests passed. The new grammar tests
  cover declaration scopes, multiline resources, contextual identifiers, and
  strings/comments. Packaged a 13-file runtime VSIX (48.66 KB), installed it
  locally, and reloaded the Sandbox window.
- Test Explorer completed at **156/156**: 21 file results and 135 assertions.
- Opened `examples/native_resource_contract.sg` and visually verified the
  resource keyword, facade type, native pointer type, drop keyword, and destructor
  highlighting in the real editor.
- Run Current File displayed `S190` at `(1,39)` for a resource whose destructor
  `native::absent` does not exist. The output explained the required parameter,
  return type, and native origin, then reported exit code 1. The temporary source
  was closed and removed afterward.
- Sage file icons remained visible alongside Material Icon Theme. The extension
  contributes no file icon theme and does not change the user's theme settings.

Compiler Debug/Release builds and full regressions passed, including 31 native
resource contract cases. This stage supports validated declarations and generated
C facade types only. Resource values, ownership transfer, automatic resource
cleanup, and safe file APIs are not enabled by these declarations.
