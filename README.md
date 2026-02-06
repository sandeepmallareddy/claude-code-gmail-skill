<div align="center">

# Claude Code Gmail Skill

**Manage your Gmail emails using natural language in Claude Code**

[![Node.js Version](https://img.shields.io/node/v/%40anthropic-ai%2Fclaude-code?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Skill-green)](https://code.claude.com/docs/en/skills)

</div>

---

## About

A powerful [Claude Code skill](https://code.claude.com/docs/en/skills) that enables you to manage your Gmail account using natural language. Read, search, send, and organize emails through conversational commands.

```text
You: Show my unread emails
Claude: Here's your unread email summary...

You: Find emails from my manager about the budget
Claude: Found 3 emails from your manager...

You: Send a reply to Sarah thanking her for the update
Claude: Ready to send your reply to Sarah...
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Natural Language** | Talk to Claude like you're chatting with a colleague |
| **Email Reading** | List, search, and read emails with formatted output |
| **Compose & Send** | Send new emails or reply to existing threads |
| **Smart Organization** | Archive, star, label, and manage your inbox |
| **Secure Auth** | OAuth 2.0 with encrypted token storage |
| **Thread Support** | View entire conversation threads |

---

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Comes with Node.js
- **Google Account**: With access to Google Cloud Console

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/claude-code-gmail-skill.git
cd claude-code-gmail-skill
npm install
```

### 2. Configure Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Gmail API**
4. Create OAuth 2.0 credentials (Desktop application)
5. Download as `credentials.json` to the project root

### 3. Authenticate

```bash
npm run auth
```

This opens a browser for Google sign-in. Grant permissions when prompted.

### 4. Start Using

```bash
# List unread emails
npm run list -- --query="is:unread"

# Search emails
npm run search "from:boss subject:project"

# Send email
npm run send -- --to="friend@example.com" --subject="Hello" --body="Hi there!"
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/claude-code-gmail-skill.git
cd claude-code-gmail-skill
```

### Install Dependencies

```bash
npm install
```

### Google Cloud Setup

Detailed instructions for Google Cloud configuration:

1. **Create Project**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Click "New Project"
   - Name: "Gmail Skill"
   - Click "Create"

2. **Enable Gmail API**
   - Search "Gmail API" in the search bar
   - Click "Enable"

3. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Desktop application"
   - Click "Create"
   - Download JSON as `credentials.json`
   - Place in project root

4. **Configure OAuth Consent**
   - Go to "OAuth consent screen"
   - Select "External" user type
   - Fill in app details
   - Add scopes: `gmail.readonly`, `gmail.send`, `gmail.modify`
   - Add your email as a test user
   - Click "Save and Continue"

### Authentication

```bash
npm run auth
```

Follow the browser prompts to authorize access. Tokens are stored securely in `~/.config/claude-gmail/`.

---

## Usage

### Claude Code Commands

Once loaded in Claude Code, use natural language:

```text
"Show my unread emails"
"Find emails from my manager about the project"
"Send an email to john@example.com saying thanks for the update"
"Archive all newsletters from last month"
"Star this email and mark it as important"
```

### Terminal Commands

#### List Emails

```bash
# Recent emails
npm run list

# Unread emails
npm run list -- --query="is:unread"

# From specific sender
npm run list -- --query="from:boss@example.com"

# With attachments, last 7 days
npm run list -- --query="has:attachment after:7d"

# Limit results
npm run list -- --max-results=10
```

#### Search Emails

```bash
# Basic search
npm run search "from:boss"

# Combined query
npm run search "from:manager subject:budget is:unread"

# With PDFs
npm run search "filename:pdf"

# Date range
npm run search "after:2024/01/01 before:2024/12/31"
```

#### Read Email

```bash
# By message ID
npm run get -- --id=18abc123def456

# Entire thread
npm run get -- --thread=18abc123def456

# JSON format
npm run get -- --id=18abc123 --format=json
```

#### Send Email

```bash
# Simple email
npm run send -- \
  --to="friend@example.com" \
  --subject="Hello" \
  --body="Hi there!"

# Reply to thread
npm run send -- \
  --to="john@example.com" \
  --reply-to=18abc123def456 \
  --body="Thanks for your email!"

# Save as draft (doesn't send)
npm run send -- \
  --to="boss@example.com" \
  --subject="Update" \
  --body="..." \
  --draft

# With CC
npm run send -- \
  --to="friend@example.com" \
  --cc="manager@example.com" \
  --subject="Meeting" \
  --body="Let's meet tomorrow"
```

#### Modify Emails

```bash
# List available labels
npm run modify -- --list-labels

# Archive email
npm run modify -- --id=18abc123 --archive

# Star email
npm run modify -- --id=18abc123 --star

# Mark as read
npm run modify -- --id=18abc123 --mark-read

# Move to trash
npm run modify -- --id=18abc123 --trash

# Add label
npm run modify -- --id=18abc123 --add-label="Work"

# Remove label
npm run modify -- --id=18abc123 --remove-label="Personal"
```

---

## Gmail Query Syntax

| Query | Description |
|-------|-------------|
| `from:email` | From specific sender |
| `to:email` | To specific recipient |
| `subject:text` | Subject contains text |
| `is:unread` | Unread messages only |
| `is:starred` | Starred messages |
| `has:attachment` | Has attachments |
| `after:YYYY/MM/DD` | After date |
| `before:YYYY/MM/DD` | Before date |
| `label:name` | Has specific label |
| `larger:5M` | Larger than 5MB |
| `filename:pdf` | Has PDF attachment |

**Combine queries:** `from:boss is:unread after:2024/01/01`

---

## Project Structure

```
claude-code-gmail-skill/
├── .claude/
│   └── skills/
│       └── gmail/
│           ├── SKILL.md              # Skill definition
│           └── scripts/
│               ├── auth.js           # OAuth authentication
│               ├── list.js           # List messages
│               ├── get.js            # Read messages
│               ├── send.js           # Send/compose emails
│               ├── search.js         # Search messages
│               ├── modify.js         # Label/archive operations
│               └── lib/
│                   ├── gmail.js      # API client wrapper
│                   └── formatter.js  # Output formatting
├── credentials.json                  # OAuth credentials (user-provided)
├── package.json
├── .gitignore
└── README.md
```

---

## Security

### Token Storage

OAuth tokens are stored securely in:
- **Linux/macOS**: `~/.config/claude-gmail/token.json`
- **Windows**: `%APPDATA%\claude-gmail\token.json`

File permissions are set to `600` (owner read/write only).

### Credentials

- **`credentials.json`** - OAuth client secrets (never committed)
- **Refresh tokens** - Automatically refreshed when expired
- **Scope limiting** - Only requests minimum necessary permissions

### Best Practices

1. Never commit `credentials.json` to version control
2. Review OAuth scopes before authorizing
3. Revoke access when no longer needed
4. Use test users during development

---

## Configuration

### Environment Variables

Create a `.env` file for custom configuration:

```bash
# Optional: Custom token directory
GMAIL_TOKEN_DIR=~/.config/claude-gmail

# Optional: Custom credentials path
GMAIL_CREDENTIALS_PATH=./credentials.json
```

### Claude Code Settings

Add to your Claude Code settings to preload the skill:

```json
{
  "skills": {
    "preload": ["gmail"]
  }
}
```

---

## Troubleshooting

### "credentials.json not found"

```bash
# Verify file exists
ls -la credentials.json

# If missing, download from Google Cloud Console:
# APIs & Services > Credentials > OAuth 2.0 Client IDs
```

### Authentication Failed (Error 403)

Your Google account needs to be added as a test user:

1. Go to Google Cloud Console
2. Navigate to "OAuth consent screen"
3. Scroll to "Test users"
4. Click "Add Users"
5. Enter your email
6. Click "Save and Continue"

### Token Expired

```bash
# Remove old token
rm ~/.config/claude-gmail/token.json

# Re-authenticate
npm run auth
```

### Browser Won't Open

The auth command will display a URL. Copy and paste it into your browser manually.

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

### Ways to Contribute

- Report bugs
- Suggest features
- Improve documentation
- Submit pull requests

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Google Gmail API](https://developers.google.com/gmail/api) - Email infrastructure
- [Claude Code](https://code.claude.com/) - AI coding assistant
- [googleapis](https://github.com/googleapis/google-api-nodejs-client) - Node.js client library

---

<div align="center">

**Manage your Gmail with the power of Claude Code**

[Report Bug](https://github.com/yourusername/claude-code-gmail-skill/issues) · [Request Feature](https://github.com/yourusername/claude-code-gmail-skill/issues)

</div>
