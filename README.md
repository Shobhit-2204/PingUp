# PingUp

PingUp is a full-stack social media application built with the MERN stack (MongoDB, Express, React, Node). It features user profiles, posts, stories, follow/connection workflows, real-time messaging (Server-Sent Events), media uploads via ImageKit, and Clerk-powered authentication.

This repository contains two folders:
- `client/` — React + Vite front-end
- `server/` — Express API and server-side logic

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, React Router, Redux Toolkit
- Backend: Node.js, Express, MongoDB, Mongoose
- Real-time: Server-Sent Events (SSE)
- Auth: Clerk
- Media: ImageKit
- File uploads: multer
- Deployment: Vercel (client) + any Node host for the server

## Key Features
- User sign-in and authentication with Clerk
- Real-time messaging and notifications via SSE
- Posts and stories with image uploads powered by ImageKit
- Follow / connection management and role-aware views
- Responsive, component-driven React UI with Redux state management

---

## Getting Started (Local Development)

Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB connection (Atlas or local)

Environment variables
Create `.env` files in both `server/` and `client/` (see `server/.env.example` and `client/.env.example` if present). Key variables used in this project include:

Server (`server/.env`)
- MONGO_URL=your_mongodb_connection_string
- IMAGEKIT_PUBLIC_KEY=...
- IMAGEKIT_PRIVATE_KEY=...
- IMAGEKIT_URL_ENDPOINT=...
- CLERK_SECRET_KEY=... (or whichever Clerk secret you use server-side)
- PORT=5000

Client (`client/.env`)
- VITE_BASEURL=http://localhost:5000
- VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

Install dependencies

```powershell
# from repo root
cd server
npm install

cd ../client
npm install
```

Run locally

```powershell
# in one terminal
cd server
npm run server

# in another terminal
cd client
npm run dev
```

Open `http://localhost:5173` (Vite) to view the app.

---

## Project Structure
```
client/
  src/
    components/        # React components (ChatBox, RecentMessages, Notifications, etc.)
    features/          # Redux slices (user, messages, connections)
    pages/             # Route pages (Feed, Messages, Profile, Connections)
server/
  controllers/        # API controller logic
  models/             # Mongoose models
  configs/            # DB, ImageKit, multer, nodemailer
  routes/             # Express routes
```

## Important Implementation Notes
- SSE endpoint: server stores active SSE connections in an in-memory `connections` object keyed by userId and writes events directly to recipients' response streams. This is simple and effective for single-instance deployments but requires a pub/sub layer (e.g., Redis) for multi-instance scaling.

- Message population: Server uses Mongoose `.populate()` for `from_user_id` and `to_user_id` so the client can access nested user fields (profile picture, full name). Defensive checks are added on the client to handle non-message SSE pings.

- Image uploads: Server uses `multer` to accept uploads and forwards file buffers/streams to ImageKit via the official SDK, then removes temporary files.

## Deployment Notes
- Client can be deployed on Vercel or any static host (build with `npm run build` in `client/`).
- Server requires a persistent Node environment (Vercel Serverless functions are not suitable for long-lived SSE connections). Consider deploying the server to Heroku, DigitalOcean App Platform, Railway, or a containerized solution on Kubernetes.
- For horizontal scaling and reliable message delivery across instances, integrate Redis Pub/Sub to broadcast messages between server processes.

## Common Troubleshooting
- SSE connections fail on serverless platforms: move the server to a persistent host or switch to WebSockets behind a reverse proxy.
- `Cannot read properties of undefined` in client: ensure server populates message user fields (`from_user_id` and `to_user_id`) and client guards access to nested properties.
- ImageKit upload errors: validate API keys and ensure the server's upload logic cleans up temp files.

## Contributing
Contributions are welcome. Create issues for bugs or feature requests and open PRs with clear descriptions and tests where applicable.
