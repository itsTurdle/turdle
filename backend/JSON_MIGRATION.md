# JSON File Storage Migration

This backend has been migrated from MongoDB/Mongoose to use local JSON file storage.

## Changes Made

### Removed Dependencies
- `mongoose` - MongoDB object modeling library

### Added Dependencies  
- `uuid` - For generating unique IDs

### New Files
- `lib/jsonDB.js` - JSON file database operations for Users and DMs
- `db.json` - Local data storage file

### Modified Files
- `package.json` - Removed mongoose, added uuid
- `index.js` - Removed mongoose connection 
- `routes/auth.js` - Updated to use JSON database
- `routes/users.js` - Updated to use JSON database
- `routes/dms.js` - Updated to use JSON database
- `.env.example` - Removed MONGO_URI

### Removed Files
- `models/User.js` - Replaced by JSON database operations
- `models/DM.js` - Replaced by JSON database operations  
- `modelsDM.js` - Duplicate DM model file

## Environment Variables

Updated `.env.example`:
```
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

## Data Structure

The `db.json` file stores data in the following format:

```json
{
  "users": [
    {
      "id": "uuid",
      "username": "string", 
      "password": "hashed_password",
      "createdAt": "ISO_timestamp",
      "updatedAt": "ISO_timestamp" 
    }
  ],
  "dms": [
    {
      "id": "uuid",
      "users": ["user_id1", "user_id2"],
      "messages": [
        {
          "sender": "user_id",
          "content": "message_text",
          "timestamp": "ISO_timestamp"
        }
      ],
      "createdAt": "ISO_timestamp", 
      "updatedAt": "ISO_timestamp"
    }
  ]
}
```

## API Compatibility

All existing API endpoints remain the same:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users` - List all users
- `GET /api/users/me` - Get current user
- `GET /api/dms` - Get user's DMs
- `POST /api/dms` - Send a message

## Features Preserved

- JWT authentication
- Password hashing with bcrypt
- Socket.IO real-time messaging
- User listing for DM contacts
- DM conversation threads
- Message history persistence