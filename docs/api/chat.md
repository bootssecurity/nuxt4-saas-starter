# Chat API

End-to-end encrypted real-time messaging system with WebSocket support.

## REST Endpoints

### `GET /api/chat/conversations`
List all conversations for the current user.
- **Access**: Protected
- **Response**:
  ```json
  {
    "conversations": [{
      "id": 1,
      "type": "direct" | "group",
      "name": "John Doe",
      "encryptedKey": "...",
      "unreadCount": 3,
      "lastMessage": { "content": "...", "iv": "...", "createdAt": "..." },
      "participants": [{ "id": 1, "name": "...", "email": "...", "lastReadAt": "..." }]
    }]
  }
  ```

### `POST /api/chat/conversations`
Create a new conversation (direct or group).
- **Access**: Protected
- **Body**:
  ```json
  {
    "type": "direct" | "group",
    "name": "Optional Group Name",
    "participants": [
      { "userId": 1, "encryptedKey": "base64-encrypted-session-key" }
    ]
  }
  ```
- **Response**: `{ conversation: { id, type, name, createdAt } }`

### `GET /api/chat/messages`
Fetch messages for a conversation (paginated).
- **Access**: Protected
- **Query Params**:
  - `conversationId`: (required) Conversation ID
  - `limit`: Number of messages (default: 50)
  - `beforeId`: For pagination, fetch messages before this ID
- **Response**: `{ messages: [{ id, conversationId, senderId, content, iv, createdAt }] }`

### `GET /api/chat/keys`
Get public keys for all users (for E2E encryption key exchange).
- **Access**: Protected
- **Response**: `{ users: [{ id, publicKey }] }`

### `POST /api/chat/keys`
Register/update the current user's public key.
- **Access**: Protected
- **Body**: `{ publicKey: "base64-encoded-public-key" }`
- **Response**: `{ success: true }`

### `POST /api/chat/read`
Mark messages in a conversation as read.
- **Access**: Protected
- **Body**: `{ conversationId: number }`
- **Response**: `{ success: true }`

### `GET /api/chat/users`
Get list of users available for starting conversations.
- **Access**: Protected
- **Response**: `{ users: [{ id, firstName, lastName, email, publicKey }] }`

---

## WebSocket API

Connect to `/_ws` for real-time messaging.

### Message Types

#### Subscribe to Conversation
```json
{ "type": "subscribe", "conversationId": 123, "userId": 1 }
```
Subscribes to real-time updates for a conversation. Also broadcasts online presence.

#### Send Message
```json
{
  "type": "message",
  "conversationId": 123,
  "senderId": 1,
  "content": "encrypted-base64-content",
  "iv": "initialization-vector"
}
```
Persists message to DB and broadcasts to all participants.

#### Read Receipt
```json
{ "type": "read", "conversationId": 123, "userId": 1 }
```
Updates `lastReadAt` in DB and broadcasts to all participants.

### Received Events

#### New Message
```json
{ "type": "message", "conversationId": 123, "senderId": 1, "content": "...", "iv": "..." }
```

#### Read Receipt
```json
{ "type": "read", "conversationId": 123, "userId": 1, "lastReadAt": "ISO-date" }
```

#### Presence Status
```json
{ "type": "status", "userId": 1, "status": "online" | "offline", "conversationId": 123 }
```

---

## End-to-End Encryption

All messages are encrypted client-side using:
- **Key Exchange**: RSA-OAEP for session key exchange
- **Message Encryption**: AES-GCM for message content
- **Storage**: Only encrypted content (ciphertext + IV) is stored server-side

The server never has access to plaintext messages.
