# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest | ✅ |

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: security@[your-email].com
3. Or use GitHub's private vulnerability reporting

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Best Practices

This project follows these security practices:

### OAuth 2.0 Security
- CSRF protection using state parameter
- Secure token storage with `0o600` permissions
- Minimal OAuth scopes required
- Automatic token refresh

### Data Protection
- Tokens stored in `~/.config/claude-gmail/` (follows XDG standard)
- Credentials file excluded from version control
- No sensitive data in error messages

### Input Validation
- HTML sanitization for email content
- Parameter binding for API calls
- Secure base64 URL decoding

## Dependencies

This project uses the following security-reviewed dependencies:
- `googleapis` - Official Google API client
- `@google-cloud/local-auth` - Desktop authentication helper

All dependencies are regularly updated to patch security vulnerabilities.

## Compliance

- No sensitive data is collected or transmitted
- All API calls use HTTPS (enforced by Google APIs)
- Tokens never logged or exposed
