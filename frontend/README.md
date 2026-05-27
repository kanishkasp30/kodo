# Kōdo — Real-Time Collaborative Workspace for Developer Teams

> The developer's way.

**Live Demo:** https://kodo-devcollab.vercel.app  
**GitHub:** https://github.com/kamaleswari-s/kodo

## What is Kōdo?

Kōdo is a GitHub-meets-Notion-meets-Slack platform built for student developer teams. Manage projects, track tasks, write documentation, review code, and get AI assistance — all in one place, in real time.

Built for DevFusion Hackathon 2.0 — Problem Statement 6: DevCollab.

## Features

###  Workspace and Projects
- Create or join a workspace with a unique invite code
- Multiple projects per workspace
- Role system — Owner, Admin, Member, Viewer
- Invite teammates via link or WhatsApp share

###  Task Management
- Kanban board with drag and drop
- List view and Calendar view
- Task comments with @mentions — mentioned user gets notified instantly
- File attachments per task
- Priority levels — Critical, Important, Low
- Assignee, due date, and labels

###  Real-Time Collaboration
- Live board updates via Socket.IO — no refresh needed
- Presence indicators — see who is online
- Live typing indicators in task comments
- Real-time notifications for mentions and assignments

###  Code Snippet Manager
- Full syntax highlighting
- Supports JavaScript, Python, Java, C++, Go, TypeScript, SQL, Bash
- Search by title, tag, or language
- Copy to clipboard with one click

###  Documentation Wiki
- Markdown support — headings, bullets, code blocks
- Image uploads
- Page linking with [[Page Name]] syntax
- Version history with one-click restore

###  Aura AI Assistant
- Powered by Mistral 7B via Featherless AI
- Daily standup report generator
- Project blocker identifier
- Project progress summariser
- Feature breakdown into subtasks automatically
- Code reviewer — quality score out of 10, bugs, performance, security
- GitHub PR review guidance
  
###  Activity Feed
- Real-time workspace activity log
- Filter by project or by member

###  User System
- Profile with bio, skills, GitHub link, and avatar
- Real-time notification centre with unread badge
- Three themes — Warm Parchment, Midnight Navy, Carbon Ink

###  Novelties
- Live typing indicators — see teammates typing in real time
- Team velocity chart — tasks completed per day over 7 days
- Focus mode — hide sidebar and topbar with one click
- WhatsApp invite sharing

###  Payments
- Free plan — 1 workspace, 3 projects, 5 members
- Pro plan — unlimited everything, sandbox checkout


## Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | React.js, React Router, Socket.IO client |
| Backend | Node.js, Express.js, Socket.IO |
| Database | PostgreSQL |
| AI | Mistral 7B via Featherless AI |
| Authentication | JWT + bcryptjs |
| File Uploads | Multer |
| Real-time | Socket.IO WebSockets |
| Deployment | Vercel (frontend) + Railway (backend) |


## Database Schema

| Table | Purpose |
|:---|:---|
| users | User accounts and profiles |
| workspaces | Team workspaces |
| workspace_members | Workspace membership and roles |
| projects | Projects inside workspaces |
| tasks | Task management |
| task_comments | Comments on tasks |
| task_attachments | File attachments on tasks |
| snippets | Code snippets |
| wiki_pages | Wiki documentation pages |
| wiki_history | Version history for wiki pages |
| activity_log | Workspace activity feed |
| notifications | User notifications |


## Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend
npm install
node setup.js
node addNotifications.js
node addAttachments.js
node addWikiHistory.js
node index.js
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kodo_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret
PORT=5000
FEATHERLESS_API_KEY=your_key
```

## Default Login

| Field | Value |
|:---|:---|
| Email | admin@kodo.dev |
| Password | password |


## Open Source Libraries

| Library | Purpose |
|:---|:---|
| express | Backend web framework |
| socket.io | Real-time WebSocket communication |
| pg | PostgreSQL client |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| multer | File upload handling |
| react | Frontend UI framework |
| react-router-dom | Client-side routing |
| axios | HTTP requests |
| react-hot-toast | Toast notifications |
| react-syntax-highlighter | Code syntax highlighting |


## Project Write-up

Kōdo is a real-time collaborative workspace built for student developer teams. Instead of juggling between Trello, Notion, GitHub, and ChatGPT, Kōdo brings everything into one platform — a live Kanban board, code snippet library, documentation wiki with page linking and version history, and an AI assistant called Aura powered by Mistral 7B. Aura generates standups, reviews code with a quality score out of 10, identifies blockers, and breaks down features into subtasks. Built with React, Node.js, PostgreSQL, and Socket.IO. Novelties include live typing indicators, team velocity chart, focus mode, and WhatsApp invite sharing.


## Team

**Code Queens** — Full stack development, UI/UX design, AI integration
