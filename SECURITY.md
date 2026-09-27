# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x (pre-release) | Yes |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in ShelfMD, please report it privately using [GitHub Security Advisories](https://github.com/idawud/ShelfMD/security/advisories/new).

### What to include

- Description of the vulnerability
- Steps to reproduce (proof-of-concept if possible)
- Affected version(s)
- Your assessment of the potential impact

### Response timeline

- **Acknowledgement**: within 2 business days
- **Initial assessment**: within 7 days
- **Fix timeline**: agreed upon based on severity (critical issues targeted within 14 days)

### Disclosure policy

- We follow responsible disclosure: we will coordinate a fix before any public disclosure.
- You will be credited in the CHANGELOG unless you prefer to remain anonymous.
- We do not currently operate a bug bounty program.

## Scope

In scope:
- Arbitrary code execution via crafted Markdown files
- Path traversal / file system escapes beyond the opened book directory
- CSP bypasses allowing script injection in the renderer
- IPC command injection or privilege escalation

Out of scope:
- Denial-of-service via extremely large files (performance issue, not security)
- Issues requiring physical access to the device
- Social engineering attacks

## Security Architecture Summary

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#security) for the full security model. Key points:

- Strict CSP: no `unsafe-inline` scripts, no `unsafe-eval`
- All Markdown sanitised before rendering
- File access scoped to user-opened paths via Tauri v2 `fs` scope
- No telemetry, no network access except user-initiated URL opens
