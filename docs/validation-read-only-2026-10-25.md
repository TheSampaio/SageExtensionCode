# Extension 0.11.0 / Sage 0.23.0 validation

Validated on 2026-10-25 in the existing VS Code Sandbox workspace.

- JavaScript syntax check and all 17 Node tests passed, including language-icon
  contribution without replacing the active file-icon theme.
- VSIX packaged: 13 files, 53.48 KB. Installed the local package and reloaded
  the existing window.
- Run Current File used `open_read_bytes` on a real read-only file containing
  bytes 0/255, confirmed `can_write=false`, read count=2 with clean EOF, and
  rejected byte/block writes and flush. PowerShell independently verified
  unchanged content/attributes and exclusive reopen after close.
- Query after consuming close reported S140 at `(1,123)`, move at `(1,77)`,
  exit 1. Temporary probes and their outputs were closed and removed.
- Test Explorer passed 229/229: 26 file results plus 203 Sage assertions.
- Material Icon Theme remains selected. No `iconThemes` replacement contribution
  or mutation of theme settings was introduced.

Compiler validation: Debug/Release builds with zero warnings/errors; all 24
PowerShell scripts; 26 Sandbox files / 203 assertions per configuration. New
read-only tests add 44 native assertions under strict C warnings, 19 Sage
integration assertions, five negative cases, native output-call counters,
read-only source preservation and four matching tracked opens/closes across
generated translation units. Runtime relocation and Release publish also pass.

The same ByteFile type carries a mode capability fixed by its constructor.
Readonly restrictions are checked at runtime before incompatible stdio; even
zero-limit writes fail. `can_write` is not an OS-permission or I/O-success check.
General update/append modes and Unicode paths remain unfinished. See compiler
`docs/byte-files.md` for the full contract.
