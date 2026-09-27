# Microsoft Store Release — Manual Partner Center Steps

This document describes the manual steps required to submit ShelfMD to the Microsoft Store via Partner Center after the CI pipeline has built the MSIX package.

## Prerequisites

- Active Microsoft Developer account (one-time $19 USD registration fee)
- MSIX package built and signed by CI (`src-tauri/target/release/bundle/msi/*.msi` or MSIX from `pnpm tauri build --bundles msi`)
- Store listing assets (see below)

## Step 1: Create the App in Partner Center

1. Sign in at [partner.microsoft.com](https://partner.microsoft.com/dashboard).
2. Navigate to **Windows & Xbox** → **Overview** → **Create a new app**.
3. Reserve the name **ShelfMD** (check availability first).
4. Note the **Store ID** assigned (e.g., `9XXXXXXXXX`) — add it to `tauri.conf.json` bundle.windows.storePid once known.

## Step 2: Set Up App Identity

1. Go to **App management** → **App identity**.
2. Note the **Package/Identity/Name**, **Package/Identity/Publisher**, and **Package/Properties/PublisherDisplayName** values.
3. Update `src-tauri/tauri.conf.json`:
   ```json
   "bundle": {
     "publisher": "<PublisherDisplayName from Partner Center>",
     "windows": {
       "storePid": "<Store ID>"
     }
   }
   ```
4. Update `src-tauri/Cargo.toml` authors field to match.

## Step 3: Prepare Store Listing Assets

Required assets (see Partner Center image requirements):

| Asset | Size | Format |
|-------|------|--------|
| Store logo | 300×300 px | PNG, no transparency |
| Feature graphic | 1920×1080 px | PNG or JPEG |
| Screenshots | At least 1, min 1366×768 px | PNG or JPEG |
| Trailer (optional) | MP4 ≤ 2 GB | MP4 |

Recommended screenshots:
1. Library home screen with a book open
2. Reader view in dark mode
3. Reader view in light mode with outline sidebar
4. Code block with syntax highlighting
5. Mermaid diagram rendering

## Step 4: Fill in the Store Listing

1. In Partner Center, navigate to **Store listings** → **English (United States)**.
2. Use the content from [store/listing.md](../store/listing.md):
   - **Description**: Long description
   - **Short description**: Short description (≤200 chars)
   - **Search terms**: `markdown reader`, `book reader`, `md viewer`, `obsidian reader`, `documentation reader`
3. Set **Category**: Productivity → Reference tools
4. **Age rating**: PEGI 3 / Everyone (complete the rating questionnaire — no violence, no user-generated content, no in-app purchases)
5. **Privacy policy URL**: `https://github.com/idawud/ShelfMD/blob/main/PRIVACY.md`

## Step 5: Pricing and Availability

1. **Base price**: Free
2. **Markets**: All markets (or select specific ones)
3. **Release date**: Publish as soon as certification passes

## Step 6: Packages

1. Navigate to **Packages**.
2. Upload the MSIX produced by CI.
3. Verify the package metadata matches the Partner Center app identity (Package Name, Publisher).

## Step 7: Submit for Certification

1. Review all sections — Partner Center will show a checklist.
2. Click **Submit to the Store**.
3. Certification typically takes 1–3 business days.
4. Monitor the **Certification status** page for any policy failures.

## Step 8: Post-Certification

1. Once certified, the app appears in the Store within 24 hours.
2. Add the Store badge to the GitHub README.
3. Tag the release in git: `git tag v0.1.0 && git push --tags`.

## Updating an Existing Submission

1. Build a new MSIX with an incremented version (update `package.json`, `Cargo.toml`, `tauri.conf.json` — all three must match).
2. In Partner Center, navigate to the app → **Start update**.
3. Upload the new package.
4. Update release notes in the Store listing.
5. Submit.

## Secrets Required in GitHub Actions

| Secret | Description |
|--------|-------------|
| `TAURI_SIGNING_PRIVATE_KEY` | Code-signing private key (PEM) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Passphrase for the signing key |
| `MS_TENANT_ID` | Azure AD tenant ID for Store API |
| `MS_CLIENT_ID` | Azure AD application client ID |
| `MS_CLIENT_SECRET` | Azure AD client secret |
| `MS_SELLER_ID` | Partner Center seller ID |

See [Tauri v2 code signing docs](https://tauri.app/distribute/sign/windows/) for generating signing keys.
