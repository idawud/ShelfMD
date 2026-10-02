# Publishing to WinGet

ShelfMD is distributed through the [Windows Package Manager](https://learn.microsoft.com/windows/package-manager/)
as `idawud.ShelfMD`. Installs via `winget` don't carry the browser's Mark-of-the-Web, so users don't see the
SmartScreen "isn't commonly downloaded" warning that the unsigned GitHub Release installers trigger.

## Ongoing releases (automated)

`.github/workflows/winget.yml` runs when a GitHub Release is **published** (not while it is a draft) and opens a
PR against [microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs) with the new version's `.exe` and
`.msi`. Microsoft's validation pipeline reviews and merges it, usually within a day or two.

Requirements (one-time):

1. **Fork** [microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs) to the `idawud` account.
2. Create a **classic** personal access token with the `public_repo` and `workflow` scopes
   (fine-grained tokens aren't supported).
3. Add it as the repository secret `WINGET_TOKEN`:
   `gh secret set WINGET_TOKEN`

## First submission (manual, one-time)

The action can only update a package that already exists in winget-pkgs, so the first version is submitted by hand
with [Komac](https://github.com/russellbanks/Komac) (runs on Windows, Linux and macOS).

1. Publish the release on GitHub (un-draft it) so the installer URLs are public.
2. Install Komac — on Windows: `winget install russellbanks.Komac`; elsewhere see its releases page.
3. Run, with a classic token (`public_repo` scope) in `GITHUB_TOKEN`:

   ```bash
   komac new idawud.ShelfMD \
     --version 2.0.0 \
     --urls https://github.com/idawud/ShelfMD/releases/download/v2.0.0/ShelfMD_2.0.0_x64-setup.exe \
            https://github.com/idawud/ShelfMD/releases/download/v2.0.0/ShelfMD_2.0.0_x64_en-US.msi
   ```

   Suggested answers to the prompts:

   | Field             | Value                                                                                         |
   | ----------------- | --------------------------------------------------------------------------------------------- |
   | Publisher         | `idawud`                                                                                      |
   | PackageName       | `ShelfMD`                                                                                     |
   | Moniker           | `shelfmd`                                                                                     |
   | License           | `MIT`                                                                                         |
   | LicenseUrl        | `https://github.com/idawud/ShelfMD/blob/main/LICENSE`                                         |
   | ShortDescription  | `Markdown book reader`                                                                        |
   | Description       | `Read multi-file Markdown books with cross-file links, reading memory, and beautiful typography.` |
   | PackageUrl        | `https://github.com/idawud/ShelfMD`                                                           |
   | Tags              | `markdown`, `reader`, `ebook`                                                                 |

4. Let Komac submit the PR, then watch it for validation comments from the `wingetbot`.

Once that PR is merged, every later published release is handled by the workflow.
