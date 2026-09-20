# 🚀 CollabFlow — Enterprise Real-Time Project Management & Kanban Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **CollabFlow** is a modern, enterprise-grade project management and real-time Kanban platform inspired by **Linear** and **GitHub Projects**. Built with clean architecture, strict TypeScript types, optimistic UI state management with rollback snapshots, and real-time multiplayer WebSockets.

---

## 🌟 Key Features & Architectural Highlights

### 1. ⚡ Fluid Drag-and-Drop Kanban with Optimistic Updates
- **Zero-Latency Interactions:** Utilizes `@dnd-kit/core` and `@dnd-kit/sortable` with custom pointer sensors.
- **Optimistic State Management:** Local Zustand store mutates immediately upon drop (0ms perceived lag).
- **Snapshot Rollback:** If the server returns an error or network timeout occurs, state automatically rolls back to the pre-drag snapshot with an alert toast.
- **Transactional Database Reordering:** Uses Prisma database transactions (`$transaction`) to atomically shift order indices when cards are moved across or within columns.

### 2. 👥 Real-Time Multiplayer Sync & Active Presence
- **Room-based Collaboration:** Clients join dedicated Socket.io rooms (`board:{boardId}`).
- **Multi-user Live Sync:** Creating, dragging, updating, or deleting tasks instantly propagates to all other active users in the room.
- **Presence Avatars:** Live avatar circles in the top navigation show active collaborators with pulse indicators.

### 3. 🎯 1-Click Recruiter Demo Access
- Built-in **"🚀 Explore Live Demo as Guest"** button on the landing screen.
- Instantly authenticates a pre-seeded Staff Lead demo account (`demo@collabflow.dev`), bypassing manual registration.
- Pre-populated with **12 realistic engineering tasks** (e.g., token rotation, PostgreSQL indexing, Docker distroless builds, WebSockets reconnection).

### 4. 📝 Rich Task Detail Modal
- **Live Markdown Support:** Split/tabbed raw markdown editor and formatted HTML live preview.
- **Interactive Subtasks Checklist:** Dynamic progress bar showing real-time completion percentage (e.g., `3 of 5 completed`).
- **Priority Selector:** Visual badges (`Urgent` = Red, `High` = Orange, `Medium` = Yellow, `Low` = Slate).
- **Assignee Avatar Picker & Due Dates:** Full user assignment and relative due date formatting.
- **Task Audit Trail:** Contextual history timeline of actions performed on each issue.

### 5. ⌨️ Global `Cmd+K` / `Ctrl+K` Command Palette & Filters
- Global shortcut listener with instant client-side fuzzy search.
- Quick action navigation (Create issue, Filter My Tasks, Filter High Priority, Toggle Audit Trail).
- Debounced client-side filter bar with tag pills and status toggles.

---

## 🏗️ System Architecture

```text
CollabFlow/
├── client/                     # Vite + React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── board/          # KanbanBoard, KanbanColumn, TaskCard, TaskDetailModal, CreateTaskModal
│   │   │   ├── common/         # Navbar, PresenceAvatars, FilterBar, CommandPalette, Toast, ActivityDrawer
│   │   │   └── auth/           # AuthModal (with 1-Click Guest Demo)
│   │   ├── hooks/              # useSocket, useDebounce
│   │   ├── services/           # api.ts (Fetch + JWT), socket.ts (Socket.io client)
│   │   ├── store/              # boardStore.ts (Optimistic UI & Rollback), authStore.ts
│   │   └── types/              # Domain TypeScript interfaces
│   └── ...
├── server/                     # Node.js + Express + TypeScript + Prisma ORM + Socket.io
│   ├── prisma/
│   │   ├── schema.prisma       # User, Board, Column, Task, ActivityLog models
│   │   └── seed.ts             # 12 Realistic Engineering Tasks + Team Members Seed
│   ├── src/
│   │   ├── controllers/        # auth, board, task (atomic DnD moves), activity
│   │   ├── middleware/         # JWT auth guard, Zod payload validation
│   │   ├── routes/             # REST endpoints
│   │   ├── sockets/            # Socket.io room management & presence tracker
│   │   └── index.ts            # Server entrypoint & WebSocket listener
│   └── ...
└── package.json                # Monorepo concurrent execution scripts
```

---

## 🗄️ Database Schema (Prisma ORM)

```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  name         String
  avatarUrl    String?
  passwordHash String
  role         String        @default("MEMBER") // ADMIN, MEMBER
  createdAt    DateTime      @default(now())
  
  boards       Board[]
  tasks        Task[]        @relation("AssignedTasks")
  activities   ActivityLog[]
}

model Board {
  id          String        @id @default(uuid())
  title       String
  description String?
  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  columns     Column[]
  tasks       Task[]
  activities  ActivityLog[]
}

model Column {
  id        String   @id @default(uuid())
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  title     String
  order     Int
  color     String   @default("#64748b")
  tasks     Task[]
}

model Task {
  id          String        @id @default(uuid())
  columnId    String
  column      Column        @relation(fields: [columnId], references: [id], onDelete: Cascade)
  boardId     String
  board       Board         @relation(fields: [boardId], references: [id], onDelete: Cascade)
  title       String
  description String?
  priority    String        @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  order       Int           @default(0)
  dueDate     DateTime?
  assigneeId  String?
  assignee    User?         @relation("AssignedTasks", fields: [assigneeId], references: [id])
  tags        String        @default("[]") // JSON string array
  subtasks    String        @default("[]") // JSON checklist items
  activities  ActivityLog[]
}

model ActivityLog {
  id        String   @id @default(uuid())
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  taskId    String?
  task      Task?    @relation(fields: [taskId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String
  metadata  String?
  createdAt DateTime @default(now())
}
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js 18+ and npm installed

### 1. Clone & Install Dependencies
```bash
# Install root, server, and client dependencies
npm run install:all
```

### 2. Configure Environment Variables
Server `.env` (`server/.env`):
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="collabflow_super_secret_jwt_key_2026_enterprise_showcase"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 3. Initialize & Seed Database
```bash
# Generate Prisma client, push SQLite schema, and seed 12 realistic tasks
npm run seed
```

### 4. Run Development Servers
```bash
# Concurrently runs Server (port 5000) and Client (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Click **"🚀 Explore Live Demo as Guest"** for instant 1-click access!

---

## 🚢 Production Deployment Guide

### A. Deploy Server to [Render.com](https://render.com)
1. Push this repository to GitHub.
2. Create a new **Web Service** on Render connected to your repository.
3. Configure the service:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command:** `npm start`
4. Add Environment Variables in Render:
   - `PORT`: `5000`
   - `JWT_SECRET`: *(Generate a secure random string)*
   - `DATABASE_URL`: *(Render PostgreSQL connection string or Supabase URL)*
   - `CORS_ORIGIN`: `https://your-collabflow-client.vercel.app`
   - `NODE_ENV`: `production`
5. Optional: Run seed script via Render Shell:
   ```bash
   npx tsx prisma/seed.ts
   ```

### B. Deploy Client to [Vercel](https://vercel.com)
1. Import your GitHub repository in Vercel.
2. Configure project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variables in Vercel:
   - `VITE_API_BASE_URL`: `https://your-render-service.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-render-service.onrender.com`
4. Click **Deploy**.

---

## 💼 Senior / Staff Engineer Portfolio Talking Points

When presenting this project in technical interviews:

1. **Optimistic UI with Conflict Management:**
   - How Zustand captures immutable state snapshots prior to drag-and-drop operations, updating UI at 60 FPS, and smoothly rolling back if network calls fail.
2. **Multiplayer WebSocket Architecture:**
   - Isolated room topologies (`board:{id}`) prevent cross-workspace socket broadcast noise.
   - Heartbeat presence tracking with automatic disconnect cleanup.
3. **Database Concurrency & Transaction Isolation:**
   - Atomic `$transaction` batch reordering avoids race conditions and order drift when multiple team members reorganize issues concurrently.
4. **Clean Code & Type Safety:**
   - End-to-end TypeScript types shared cleanly across services, hooks, and presentation layers.
   - Zod runtime schema validation protecting all incoming API mutations.

---

## 📄 License
MIT License © 2026 CollabFlow
#   C o l l a b F l o w  
 