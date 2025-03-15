# Game Companion App Backend API

A backend API using Node.js, Express, Sequelize (PostgreSQL), and Socket.io for a game companion app. This backend manages users and inventory items while supporting CRUD operations and real-time inventory updates using WebSockets.

## Features

- User management with UUID primary keys
- Inventory item management with associations to users
- RESTful API endpoints for CRUD operations
- Real-time inventory updates using Socket.io

## API Endpoints

### Users

- `GET /users` - Get all users
- `POST /users` - Create a user
- `GET /users/:id` - Get a user with their inventory
- `DELETE /users/:id` - Delete a user (cascade deletes their items)

### Items

- `POST /items` - Create an item for a user
- `GET /items/:id` - Get a single item
- `PUT /items/:id` - Update an item
- `DELETE /items/:id` - Delete an item

## WebSocket Events

### Client to Server

- `subscribeToInventory` - Subscribe to inventory updates for a specific user
- `unsubscribeFromInventory` - Unsubscribe from inventory updates for a specific user

### Server to Client

- `itemAdded` - Emitted when an item is added to a user's inventory
- `itemUpdated` - Emitted when an item in a user's inventory is updated
- `itemDeleted` - Emitted when an item is removed from a user's inventory
- `userDeleted` - Emitted when a user is deleted

## Getting Started

### Running with Docker Compose

1. Set up environment variables in `.env`:
   ```
   POSTGRES_DB=inventory
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   PORT=3000
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
   POSTGRES_DB=inventory
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   PORT=3000
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