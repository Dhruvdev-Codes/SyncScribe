# SyncScribe 🚀
### Real-Time Collaborative Document Editor with AI Integration

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-teal.svg)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8.svg)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.0-black.svg)](https://socket.io/)

**SyncScribe** is a modern, high-performance, real-time collaborative document workspace powered by an intelligent AI Copilot. Built with React, Node.js, Socket.IO, Prisma, and a Python FastAPI AI engine, SyncScribe delivers Google Docs-grade real-time multiplayer editing alongside Notion-style AI generation and formatting capabilities.

---

## 🌟 Key Features

### 1. ⚡ Real-Time Collaborative Editing
- **Multiplayer State Synchronization**: Instantaneous, conflict-resilient document synchronization over WebSockets / Socket.IO.
- **Live Cursors & User Presence**: Real-time cursor movement, selection highlighting, and user identification with assigned colors and avatars.
- **Typing Indicators & Active Collaborator Bar**: Visual cues showing who is currently editing and viewing the document.
- **Auto-Save & Status Indicators**: Debounced background persistence with visible sync status (`Saved`, `Saving...`, `Offline`).

### 2. 🤖 AI Superpowers & Copilot
- **Inline AI Command Palette (`Ctrl + K` / `Cmd + K`)**: Generate, expand, brainstorm, or rewrite text inline on demand.
- **Smart Text Rewriting**: Transform selected text into different tones (*Formal*, *Casual*, *Concise*, *Creative*) or fix grammar & readability instantly.
- **AI Document Summarization**: One-click executive summary and key takeaway extraction.
- **Interactive AI Copilot Sidebar**: Chat with your document context, ask questions, draft outlines, and brainstorm new ideas.
- **Smart Ghost Suggestions**: Intelligent contextual autocomplete.
- **Multi-Provider AI Engine**: Native support for OpenAI, Google Gemini, Anthropic, or an intelligent built-in fallback engine that runs 100% offline out-of-the-box.

### 3. 📜 Version History & Snapshots
- **Time-Travel Versioning**: Automatic revision snapshots and named manual savepoints.
- **Visual Diff Comparison**: Side-by-side or highlighted comparison of document revisions.
- **One-Click Restore**: Safely roll back to any prior state without losing historical records.

### 4. 💬 Inline Comments & Live Chat
- **Threaded Inline Comments**: Highlight any text span to attach discussions, resolve threads, and mention teammates.
- **Real-Time Room Chat**: Synchronized channel for fast team communication without leaving the editor.

### 5. 📑 Document Management & Templates
- **Template Library**: Ready-to-use templates for *Meeting Notes*, *Product Specs (PRD)*, *Technical RFCs*, *Brainstorming*, and *Blog Posts*.
- **Full-Featured Dashboard**: Search, tag filtering, grid/list view, sorting, and document duplication.
- **Document Outline & Live Stats**: Real-time word count, character count, estimated reading time, and heading navigation.
- **Export & Import**: Export to **Markdown**, **HTML**, **Plain Text**, and **PDF Print**, or import existing Markdown files.

### 6. 🔐 Authentication & Role-Based Access
- **User Accounts**: Sign up and log in with email + password (bcrypt-hashed) and JWT session tokens.
- **Dedicated Pages**: `./login`, `./signup`, and a developer-only portal at `./dev/login`.
- **Developer Portal**: Role-locked developer login (`developer`/`admin`) grants access to the diagnostic console at `./dev/dashboard` with system telemetry, database stats, and dev activity feeds.
- **Seeded Default Developer**: Run `npm run seed --prefix server` to create `dhruv@syncscribe.dev` (override with `DEV_SEED_EMAIL` / `DEV_SEED_PASSWORD` env vars).
- **Auth API**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/login/developer`, `GET /api/auth/me`. All activity (login/registration) is recorded in the telemetry audit log.


---

## 🏗️ System Architecture

```
                                  +-----------------------------+
                                  |       React Frontend        |
                                  | (Vite, TS, Tailwind, TipTap)|
                                  +--------------+--------------+
                                                 |
                       +-------------------------+-------------------------+
                       | HTTP / REST API                                   | WebSocket (Socket.IO)
                       v                                                   v
        +-----------------------------+                   +----------------------------------+
        |     Node.js / Express       | <===============> |       Socket.IO Gateway          |
        |  REST Controller & Prisma   |                   | (Rooms, Cursors, Deltas, Presence)|
        +--------------+--------------+                   +----------------------------------+
                       |
         +-------------+-------------+
         |                           |
         v                           v
+------------------+       +---------------------+
| SQLite / Postgres|       |  FastAPI AI Service  |
| Database Storage |       | (OpenAI/Gemini/Local)|
+------------------+       +---------------------+
```

---

## 📂 Project Structure

```
SyncScribe/
├── client/                     # Frontend Application (React + Vite + TypeScript)
├── server/                     # Backend API & Real-time Server (Node.js + Express)
├── ai-service/                 # AI Microservice (Python FastAPI)
├── docker-compose.yml          # Container orchestration for all services
├── package.json                # Monorepo runner scripts
└── README.md                   # Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Python**: >= 3.9 (optional for AI microservice)

### Quick Install & Run

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start the application**:
   ```bash
   npm run dev
   ```
   - **Frontend**: `http://localhost:5173`
   - **Backend API & WebSockets**: `http://localhost:5000`

---

## 📡 WebSocket Event Protocol

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join-document` | Client -> Server | `{ documentId, user }` | Joins a document room |
| `user-joined` | Server -> Client | `{ user, activeUsers }` | Broadcasts user joined |
| `send-changes` | Client -> Server | `{ documentId, content, delta, version }` | Broadcasts text change |
| `receive-changes` | Server -> Client | `{ content, delta, version, senderId }` | Applies peer delta |
| `cursor-move` | Client -> Server | `{ documentId, cursor, user }` | Broadcasts cursor position |
| `cursor-update` | Server -> Client | `{ userId, cursor, user }` | Updates peer cursor |
| `send-comment` | Client -> Server | `{ documentId, comment }` | Broadcasts new comment |
| `receive-comment` | Server -> Client | `{ comment }` | Receives peer comment |
| `send-chat` | Client -> Server | `{ documentId, message }` | Sends live room chat |
| `receive-chat` | Server -> Client | `{ message }` | Receives live room chat |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
