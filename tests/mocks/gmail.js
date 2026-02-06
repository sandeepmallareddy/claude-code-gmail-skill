/**
 * Mock Gmail API responses for testing
 */

/**
 * Mock message payload for testing
 */
export const mockMessagePayload = {
  id: '18abc123def456',
  threadId: '18abc123def456',
  labelIds: ['INBOX', 'UNREAD'],
  snippet: 'This is a sample email snippet for testing purposes.',
  payload: {
    headers: [
      { name: 'Subject', value: 'Test Email Subject' },
      { name: 'From', value: 'John Doe <john.doe@example.com>' },
      { name: 'To', value: 'jane@example.com' },
      { name: 'Cc', value: 'boss@example.com' },
      { name: 'Date', value: '2024-01-15T10:30:00.000Z' },
      { name: 'Message-ID', value: '<abc123@mail.example.com>' }
    ],
    body: {
      data: 'VGVzdCBib2R5IGNvbnRlbnQ=' // "Test body content" in base64
    }
  }
};

/**
 * Mock multipart message payload
 */
export const mockMultipartPayload = {
  id: '18abc456def789',
  threadId: '18abc456def789',
  labelIds: ['INBOX'],
  snippet: 'Multipart email test',
  payload: {
    headers: [
      { name: 'Subject', value: 'Multipart Test Email' },
      { name: 'From', value: 'Sender <sender@test.com>' },
      { name: 'To', value: 'recipient@test.com' },
      { name: 'Date', value: '2024-01-15T10:30:00.000Z' }
    ],
    parts: [
      {
        mimeType: 'text/plain',
        body: {
          data: 'VGhpcyBpcyB0aGUgcGxhaW4gdGV4dCBwYXJ0' // "This is the plain text part"
        }
      },
      {
        mimeType: 'text/html',
        body: {
          data: 'PGh0bWw+PGJvZHk+SFRNTCB0ZXh0PC9ib2R5PjwvaHRtbD4=' // "<html><body>HTML text</body></html>"
        }
      }
    ]
  }
};

/**
 * Mock message list response
 */
export const mockMessageList = {
  messages: [
    { id: 'msg001', threadId: 'thread001', labelIds: ['INBOX', 'UNREAD'] },
    { id: 'msg002', threadId: 'thread002', labelIds: ['INBOX'] },
    { id: 'msg003', threadId: 'thread003', labelIds: ['SENT', 'IMPORTANT'] }
  ],
  resultSizeEstimate: 3,
  nextPageToken: 'next123'
};

/**
 * Mock thread response
 */
export const mockThread = {
  id: 'thread123',
  messages: [
    {
      id: 'msg001',
      threadId: 'thread123',
      labelIds: ['INBOX'],
      snippet: 'First message in thread',
      payload: {
        headers: [
          { name: 'Subject', value: 'Thread Subject' },
          { name: 'From', value: 'sender@example.com' },
          { name: 'To', value: 'recipient@example.com' },
          { name: 'Date', value: '2024-01-15T10:00:00.000Z' },
          { name: 'Message-ID', value: '<msg1@mail.com>' }
        ],
        body: {
          data: 'Rmlyc3QgbWVzc2FnZQ==' // "First message"
        }
      }
    },
    {
      id: 'msg002',
      threadId: 'thread123',
      labelIds: ['INBOX'],
      snippet: 'Reply to thread',
      payload: {
        headers: [
          { name: 'Subject', value: 'Re: Thread Subject' },
          { name: 'From', value: 'recipient@example.com' },
          { name: 'To', value: 'sender@example.com' },
          { name: 'Date', value: '2024-01-15T11:00:00.000Z' },
          { name: 'In-Reply-To', value: '<msg1@mail.com>' },
          { name: 'References', value: '<msg1@mail.com>' }
        ],
        body: {
          data: 'UmVwbHkgdG8gdGhyZWFk' // "Reply to thread"
        }
      }
    }
  ]
};

/**
 * Mock labels response
 */
export const mockLabels = {
  labels: [
    { id: 'INBOX', name: 'INBOX', type: 'system' },
    { id: 'SENT', name: 'SENT', type: 'system' },
    { id: 'DRAFT', name: 'DRAFT', type: 'system' },
    { id: 'SPAM', name: 'SPAM', type: 'system' },
    { id: 'TRASH', name: 'TRASH', type: 'system' },
    { id: 'STARRED', name: 'STARRED', type: 'system' },
    { id: 'IMPORTANT', name: 'IMPORTANT', type: 'system' },
    { id: 'CATEGORY_PERSONAL', name: 'CATEGORY_PERSONAL', type: 'system' },
    { id: 'user-label-1', name: 'Work', type: 'user' },
    { id: 'user-label-2', name: 'Personal', type: 'user' }
  ]
};

/**
 * Mock profile response
 */
export const mockProfile = {
  emailAddress: 'testuser@gmail.com',
  messagesTotal: 1000,
  threadsTotal: 500,
  historyId: '12345'
};

/**
 * Mock OAuth token
 */
export const mockToken = {
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify',
  token_type: 'Bearer',
  expiry_date: Date.now() + 3600000, // 1 hour from now
  id_token: 'mock_id_token'
};

/**
 * Email with HTML containing potentially dangerous content
 */
export const mockHtmlMessage = {
  id: '18abc789ghi012',
  threadId: '18abc789ghi012',
  labelIds: ['INBOX'],
  snippet: 'HTML email with malicious content',
  payload: {
    headers: [
      { name: 'Subject', value: 'HTML Test Email' },
      { name: 'From', value: 'test@example.com' },
      { name: 'To', value: 'recipient@test.com' },
      { name: 'Date', value: '2024-01-15T10:30:00.000Z' }
    ],
    parts: [
      {
        mimeType: 'text/html',
        body: {
          data: 'PGh0bWw+PGJvZHk+PGltZyBzcmM9ImphdmFzY3JpcHQ6YWxlcnQoJ3h6JylIiPiBVc2VyIGluZm88L2JvZHk+PGZvcm0+PGlu cHV0IG5hbWU9ImN2ZSI+PC9mb3JtPjwvaHRtbD4='
        }
      }
    ]
  }
};

/**
 * Mock attachment info
 */
export const mockAttachments = [
  { id: 'att1', filename: 'document.pdf', mimeType: 'application/pdf', size: 1048576 },
  { id: 'att2', filename: 'image.jpg', mimeType: 'image/jpeg', size: 524288 },
  { id: 'att3', filename: 'spreadsheet.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 2097152 }
];
