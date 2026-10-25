# Extension 0.9.0 / Sage 0.21.0 validation

Validated on 2026-10-25 in the existing VS Code Sandbox workspace.

- JavaScript syntax check and all 17 Node tests passed, including the manifest
  check for a language icon without an icon-theme replacement.
- VSIX packaged successfully: 13 files, 52.46 KB. Installed the local package and
  reloaded the existing window.
- Run Current File on `Sandbox/examples/owned_byte_buffer.sg` reports
  `Buffer value: 42`. A temporary use-after-release probe reports S140 at
  `(2,117)`, the move at `(2,67)`, and exit 1. Probe closed and removed afterward.
- Test Explorer passed 212/212: 24 file results plus 188 Sage assertions.
- The existing `material-icon-theme` setting remains selected. No theme settings
  were written and no `iconThemes` contribution was introduced.

Compiler evidence: Debug/Release builds with zero warnings/errors, all 22
PowerShell regression scripts, 24 Sandbox files / 188 assertions per
configuration, 31 native buffer assertions with strict C warnings, 31 buffer API
assertions, eight file-integration assertions with independently verified bytes,
six cleanup assertions / six matching allocations and frees, and ten rejected
invalid programs. Published compiler/runtime relocation also passed with native
support outside the Sage-only std.

The buffer has fixed capacity and exposes only initialized bytes. Slice, resize,
bulk-I/O and general owned-string contracts remain future work. See compiler
`docs/byte-buffers.md` and `docs/validation-byte-buffers-2026-10-25.md`.
