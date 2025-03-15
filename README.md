# Game Companion App Backend API

A backend API using Node.js, Express, Sequelize (PostgreSQL), and Socket.io for a game companion app. This backend manages users and inventory items while supporting CRUD operations and real-time inventory updates using WebSockets.

## Features

- User management with UUID primary keys
- Inventory item management with associations to users
- RESTful API endpoints for CRUD operations
- Real-time inventory updates using Socket.io
- Authentication with JWT, OAuth (Discord)
- User sessions with refresh tokens

## API Endpoints

### Authentication

- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login with email/password
- `GET /auth/discord` - Login/register via Discord OAuth
- `POST /auth/refresh-token` - Get a new access token
- `POST /auth/logout` - Revoke refresh token

### Users

- `GET /users` - Get all users (protected)
- `POST /users` - Create a user (protected)
- `GET /users/:id` - Get a user with their inventory (protected)
- `DELETE /users/:id` - Delete a user (cascade deletes their items) (protected)

### Items

- `POST /items` - Create an item for a user (protected)
- `GET /items/:id` - Get a single item (protected)
- `PUT /items/:id` - Update an item (protected)
- `DELETE /items/:id` - Delete an item (protected)

## WebSocket Events

### Client to Server

- `subscribeToInventory` - Subscribe to inventory updates for a specific user
- `unsubscribeFromInventory` - Unsubscribe from inventory updates for a specific user

### Server to Client

- `itemAdded` - Emitted when an item is added to a user's inventory
- `itemUpdated` - Emitted when an item in a user's inventory is updated
- `itemDeleted` - Emitted when an item is removed from a user's inventory
- `userDeleted` - Emitted when a user is deleted

## Authentication

### JWT Authentication

The API uses JSON Web Tokens (JWT) for authentication. When a user registers or logs in, they receive an access token and a refresh token. The access token is short-lived and should be included in the Authorization header of API requests. The refresh token is long-lived and can be used to obtain a new access token when the current one expires.

### OAuth Authentication

The API supports OAuth authentication with Discord. Users can register and log in using their Discord account. The API will create a new user account if one doesn't exist for the Discord user ID.

### Protected Routes

All routes except for authentication routes are protected and require a valid JWT token in the Authorization header:

```
Authorization: Bearer your-jwt-token
```

## Getting Started

### Running with Docker Compose

1. Set up environment variables in `.env`:
   ```
   # Copy the example file
   cp .env.example .env
   
   # Edit the file with your values
   nano .env
   ```

2. Start the services:
   ```
   docker compose up -d
   ```

3. Run the migrations inside the container:
   ```
   docker compose exec backend npx sequelize-cli db:migrate
   ```

4. Access the API at `http://localhost:3000`

5. To stop the services:
   ```
   docker compose down
   ```

### Running Locally

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables in `.env`:
   ```
   # Copy the example file
   cp .env.example .env
   
   # Edit the file with your values
   nano .env
   ```

3. Run database migrations:
   ```
   npm run migrate
   ```

4. Start the server:
   ```
   npm start
   ```

5. For development with auto-reload:
   ```
   npm run dev
   ```

## Example WebSocket Client Usage

```javascript
// Connect to the WebSocket server
const socket = io('http://localhost:3000');

// Subscribe to inventory updates for a specific user
socket.emit('subscribeToInventory', 'user-uuid');

// Listen for inventory updates
socket.on('itemAdded', (item) => {
  console.log('New item added:', item);
});

socket.on('itemUpdated', (item) => {
  console.log('Item updated:', item);
});

socket.on('itemDeleted', (data) => {
  console.log('Item deleted:', data);
});

socket.on('userDeleted', (data) => {
  console.log('User deleted:', data);
});

// Unsubscribe from inventory updates
socket.emit('unsubscribeFromInventory', 'user-uuid');

// Disconnect from the WebSocket server
socket.disconnect();
```

## Example Authentication Usage

### Register a new user

```javascript
const response = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  })
});

const data = await response.json();
// data contains user info, access token, and refresh token
```

### Login with email/password

```javascript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});

const data = await response.json();
// data contains user info, access token, and refresh token
```

### Making authenticated requests

```javascript
const response = await fetch('http://localhost:3000/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const users = await response.json();
```

### Refreshing an access token

```javascript
const response = await fetch('http://localhost:3000/auth/refresh-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refreshToken: 'your-refresh-token'
  })
});

const data = await response.json();
// data contains a new access token
```

### Logging out

```javascript
const response = await fetch('http://localhost:3000/auth/logout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refreshToken: 'your-refresh-token'
  })
});
```