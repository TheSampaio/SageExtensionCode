# Extension 0.8.0 / Sage 0.20.0 validation

Validated on 2026-10-25 in the existing VS Code window for
`D:/DevelopmentLibrary/Apps/Sage/Sandbox`.

- `npm run check` and all 17 Node tests passed, including the manifest check
  forbidding a replacement file-icon theme.
- VSIX packaged successfully: 13 files, 51.78 KB. Installed the local 0.8.0
  package and reloaded the existing window.
- Explorer shows `http_client.sg` and `http_server.sg`; std contains only `.sg`.
- Run Current File created a file through safe `byte_file::create_bytes`, wrote
  byte 42, and closed it. PowerShell independently verified the persisted byte
  and exclusive reopen. A second probe rejected `0 as u8[260]` with S188 at
  `(1,63)` and exit 1. Temporary probe sources and outputs were removed.
- Test Explorer passed 180/180: 23 test-file results plus 157 Sage assertions.
- The existing `material-icon-theme` setting and Material Icon Theme installation
  remain present. No theme-setting mutation or icon-theme contribution was added.

Compiler regression evidence: 21 PowerShell scripts and the Sandbox suite pass
in Debug and Release; native byte-file fixture 66 assertions, Sage integration
23 assertions, 12 negative cases, and ten build-only array-cast checks.

Bounded ASCII byte paths accept only a 1..259-byte printable prefix of a
`u8[260]` value parameter. General strings/Unicode paths remain unfinished;
legacy `create(str)` and HTTP shell helpers retain their unsafe contracts.
