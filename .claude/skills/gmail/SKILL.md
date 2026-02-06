---
name: gmail
description: Read, search, send, and manage Gmail emails. Use when working with emails, checking inbox, finding messages, composing replies, or managing labels. Handles natural language requests about email.
allowed-tools: Bash(node *)
---

# Gmail Management Skill

This skill allows you to manage Gmail emails using natural language commands.

## Available Operations

| Task | Command |
|------|---------|
| List recent emails | `node .claude/skills/gmail/scripts/list.js` |
| List unread emails | `node .claude/skills/gmail/scripts/list.js --query="is:unread"` |
| Search emails | `node .claude/skills/gmail/scripts/search.js "<query>"` |
| Read an email | `node .claude/skills/gmail/scripts/get.js --id=<message-id>` |
| Read a thread | `node .claude/skills/gmail/scripts/get.js --thread=<thread-id>` |
| Send an email | `node .claude/skills/gmail/scripts/send.js --to="<email>" --subject="<subject>" --body="<body>"` |
| Reply to email | `node .claude/skills/gmail/scripts/send.js --to="<email>" --reply-to=<message-id> --body="<body>"` |
| Create draft | `node .claude/skills/gmail/scripts/send.js --to="<email>" --subject="<subject>" --body="<body>" --draft` |
| Archive email | `node .claude/skills/gmail/scripts/modify.js --id=<message-id> --archive` |
| Star email | `node .claude/skills/gmail/scripts/modify.js --id=<message-id> --star` |
| Mark as read | `node .claude/skills/gmail/scripts/modify.js --id=<message-id> --mark-read` |
| Move to trash | `node .claude/skills/gmail/scripts/modify.js --id=<message-id> --trash` |
| List labels | `node .claude/skills/gmail/scripts/modify.js --list-labels` |

## Search Query Syntax

Gmail supports powerful search queries:

| Query | Description |
|-------|-------------|
| `from:john` | From a specific sender |
| `to:boss` | To a specific recipient |
| `subject:meeting` | Subject contains text |
| `is:unread` | Unread messages |
| `is:starred` | Starred messages |
| `has:attachment` | Has attachments |
| `after:2024/01/01` | After a date |
| `before:2024/12/31` | Before a date |
| `label:work` | Has a specific label |
| `larger:5M` | Larger than 5MB |
| `filename:pdf` | Has PDF attachment |

Combine queries: `from:boss is:unread after:2024/01/01`

## Workflow Examples

### Check for important unread emails
```bash
node .claude/skills/gmail/scripts/list.js --query="is:unread is:important"
```

### Find and read emails from someone
```bash
# First, search for emails
node .claude/skills/gmail/scripts/search.js --from="john@example.com" --after="7d"

# Then read a specific email using the ID from search results
node .claude/skills/gmail/scripts/get.js --id=<message-id>
```

### Reply to an email
```bash
# Get the message ID from list or search, then send reply
node .claude/skills/gmail/scripts/send.js \
  --to="john@example.com" \
  --reply-to=<original-message-id> \
  --body="Thanks for your email! I'll review this and get back to you."
```

### Archive old emails
```bash
# Search for old emails
node .claude/skills/gmail/scripts/search.js --from="newsletter" --before="30d"

# Archive each one
node .claude/skills/gmail/scripts/modify.js --id=<message-id> --archive
```

## Important Notes

1. **Authentication Required**: Users must run `npm run auth` first to authorize Gmail access
2. **Message IDs**: Most operations require a message ID, obtained from list or search results
3. **Thread IDs**: Use `--thread=<id>` to view entire email conversations
4. **Confirmations**: Always confirm with the user before sending emails or making destructive changes

## Error Handling

If you see authentication errors, ask the user to run:
```bash
cd /path/to/claude-code-gmail-skill && npm run auth
```

For "credentials.json not found" errors, see the README.md for Google Cloud setup instructions.
