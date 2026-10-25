# Extension 0.10.0 / Sage 0.22.0 validation

Validated on 2026-10-25 in the existing VS Code Sandbox workspace.

- JavaScript syntax check and all 17 Node tests passed, including the manifest
  check for language icons without an icon-theme replacement.
- VSIX packaged: 13 files, 53.01 KB. Installed the local package and reloaded
  the existing window.
- Run Current File successfully wrote bytes 0/255 through `write_buffer`, then
  `read_buffer` returned count=2 and clean EOF. PowerShell independently checked
  persisted bytes and exclusive reopen after close.
- A read into a shared target was rejected with S171 at `(1,109)` and exit 1.
  Task-created probes and outputs were removed after closing the editor.
- Test Explorer passed 223/223: 25 file results plus 198 Sage assertions.
- Material Icon Theme remains selected; no theme-setting mutation or replacement
  `iconThemes` contribution was introduced.

Compiler validation: Debug/Release builds with zero warnings/errors; all 23
PowerShell scripts; 25 Sandbox files / 198 assertions in each configuration.
Block I/O adds 65 native checks under strict C warnings, 21 Sage integration
assertions and nine negative cases. Fault injection covers partial counts,
independent EOF/error flags, pre-I/O preservation and initialized-prefix bounds.
Persisted roundtrip and runtime relocation/publish checks also passed.

`byte_file` now depends on `byte_buffer.sg`. Reads replace initialized contents
after input starts; writes borrow only initialized source bytes. Zero limits
with valid owners are no-ops. General open modes, slices, resizing and Unicode
paths remain unfinished. See compiler `docs/byte-files.md` for the full contract.
