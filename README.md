# AeroChat - Real-time Chat Application

A modern, real-time chat application built with React, Node.js, Socket.IO, PostgreSQL, and Redis. Features user authentication, persistent message history, and a beautiful UI.

## 🚀 Features

- **Real-time Messaging** - Instant message delivery using Socket.IO
- **User Authentication** - Secure JWT-based authentication with bcrypt password hashing
- **Persistent Storage** - Messages and user data stored in PostgreSQL
- **Multiple Rooms** - Join different chat rooms
- **Message History** - All messages are saved and loaded when joining rooms
- **Scalable Architecture** - Redis adapter for horizontal scaling
- **Modern UI** - Built with React, Tailwind CSS, and Framer Motion animations
- **Dockerized** - Easy deployment with Docker Compose

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- Socket.IO Client
- Tailwind CSS
- Framer Motion

### Backend
- Node.js
- Express
- Socket.IO
- PostgreSQL
- Redis
- JWT Authentication
- bcryptjs

### DevOps
- Docker & Docker Compose
- Multi-container orchestration

## 📋 Prerequisites

- Docker Desktop (with WSL integration enabled for Windows)
- Git

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd DevOps-Project
   ```

2. **Configure environment variables**
   
   The `.env` file is already configured with default values:
   ```env
   POSTGRES_DB=chatdb
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=MyStrongPassw0rd
   REDIS_URL=redis://redis:6379
   ```
   
   ⚠️ **Important**: Change `POSTGRES_PASSWORD` before deploying to production!

3. **Start the application**
   ```bash
   ./deploy.sh
   ```
   
   Or using Make:
   ```bash
   make up
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

## 📦 Project Structure

```
DevOps-Project/
├── chat-backend/          # Node.js backend
│   ├── index.js          # Main server file
│   ├── package.json      # Backend dependencies
│   └── Dockerfile        # Backend container config
├── chat-frontend/         # React frontend
│   ├── src/
│   │   ├── App.jsx       # Main app component
│   │   ├── components/   # React components
│   │   └── index.css     # Styles
│   ├── package.json      # Frontend dependencies
│   └── Dockerfile        # Frontend container config
├── docker-compose.yml     # Multi-container orchestration
├── deploy.sh             # Deployment script
├── Makefile              # Make commands
└── .env                  # Environment variables
```

## 🎮 Usage

### Register a New Account
1. Navigate to http://localhost:3000
2. Click "Need an account? Register"
3. Enter a username and password
4. Click "Register"

### Login
1. Enter your credentials
2. Click "Login"
3. You'll be redirected to the chat interface

### Chat
1. Select or enter a room name (default: "lobby")
2. Click "Join" to enter the room
3. Type your message and press Enter or click Send
4. All messages are saved and will persist across sessions

### Logout
- Click the "Logout" button in the sidebar

## 🔧 Available Commands

### Using Make
```bash
make up      # Start all containers
make down    # Stop all containers
make ps      # List running containers
make logs    # View container logs
make clean   # Stop containers and remove volumes
```

### Using Docker Compose
```bash
docker compose up -d --build    # Build and start containers
docker compose down             # Stop containers
docker compose logs -f          # Follow logs
docker compose ps               # List containers
```

## 🗄️ Database

The application uses PostgreSQL for persistent storage:

- **Users Table**: Stores user credentials (hashed passwords)
- **Messages Table**: Stores all chat messages with room, user, and timestamp

Data persists in a Docker volume (`chat_pgdata`) and survives container restarts.

To reset the database:
```bash
docker compose down -v
./deploy.sh
```

## 🔐 Security Features

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens for session management (24-hour expiry)
- Socket.IO connections authenticated via JWT
- CORS enabled for API access
- Environment variables for sensitive data

## 🌐 API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /login` - Login and receive JWT token

### Messages
- `GET /rooms/:room/messages` - Get message history for a room

### Health
- `GET /health` - Health check endpoint

## 🔌 Socket.IO Events

### Client → Server
- `join` - Join a chat room
- `message` - Send a message
- `typing` - Notify typing status
- `stop_typing` - Stop typing notification

### Server → Client
- `message` - Receive a new message
- `user_joined` - User joined the room
- `user_left` - User left the room
- `typing` - User is typing
- `stop_typing` - User stopped typing

## 🐛 Troubleshooting

### Port Already in Use
If ports 3000 or 5000 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change host port
```

### Database Connection Issues
Ensure PostgreSQL container is running:
```bash
docker compose ps
docker compose logs db
```

### Frontend Not Loading
Clear browser cache (Ctrl+Shift+R) or rebuild:
```bash
docker compose up -d --build frontend
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `chatdb` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `MyStrongPassw0rd` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379` |
| `JWT_SECRET` | JWT signing secret | `secret123` |
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |

## 🚢 Deployment

For production deployment:

1. Update `.env` with secure passwords
2. Set `JWT_SECRET` to a strong random value
3. Configure HTTPS/SSL
4. Set up proper CORS origins
5. Use environment-specific configurations
6. Consider using managed database services
7. Implement rate limiting and security headers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Built with ❤️ by [Your Name]

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- React team for the amazing framework
- Docker for containerization
- PostgreSQL and Redis communities
# Aero-Chat
# Aero-Chat
# Aero-Chat
