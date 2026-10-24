# Local VS Code validation — 2026-10-24

Validated in the user's existing VS Code window with workspace
`D:/DevelopmentLibrary/Apps/Sage/Sandbox`, using the installed local Sage VSIX
and the Release build of Sage compiler v0.8.3.

- Material Icon Theme 5.39.0 remained selected (`workbench.iconTheme` was
  `material-icon-theme`). Sage's owl icon appeared in the editor tab, breadcrumbs,
  and Explorer, while the other file and folder icons remained present.
- Run Current File executed `src/main.sg` through the Sage output channel. The
  calculator ended at 1967.15, with interest 967.15 and growth 96.72%.
- Test Explorer discovered 14 Sage test files. Its successful run showed 81/81
  items: 14 file results and 67 assertion results.
- A temporary `.test.sg` program that read a moved owner was reported as
  **Errored** with `S140`, including both the access and move locations. The
  negative probe was removed after validation.

Automated development checks also passed: eight Node tests, JavaScript syntax
check, import checks for the packaging dependencies, and VSIX generation. The
package contains runtime code and assets only; development dependencies and
tests are excluded. The installed final extension version is 0.3.1.

For future smoke tests, configure `sage.command` at workspace scope to point to
the compiler build being tested, install the VSIX, reload the window, and repeat
the icon, run-command, positive-test, and negative-diagnostic checks above.
