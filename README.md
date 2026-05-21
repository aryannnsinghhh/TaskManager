# TeamTaskManager

A full-stack team task management web application with multi-organisation support, role-based access control, and a project approval pipeline.

---

## Architecture

```
Frontend (React + Vite)  →  REST API (FastAPI)  →  PostgreSQL (Supabase)
        ↕                          ↕
   localStorage JWT          JWT Auth (HS256)
```

**Frontend:** React 18, React Router, @dnd-kit for drag-and-drop, Vite  
**Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0 (async), asyncpg  
**Database:** PostgreSQL hosted on Supabase (Session Pooler for IPv4 compatibility)  
**Auth:** JWT tokens (HS256), 30-day expiry, stored in localStorage  
**Deployment:** Render (backend), Vercel/Netlify (frontend)

---

## Database Schema

```
users               → id, full_name, email, password_hash
organizations       → id, name, invite_code
org_members         → id, user_id, org_id, role (admin|member)
projects            → id, org_id, name
project_members     → id, user_id, project_id, status (pending|approved|rejected)
project_invites     → id, project_id, code (16-char), status (active|used)
tasks               → id, project_id, title, description, status, priority, due_date, created_at, sort_order, assignee_id
```

---

## Features

### Authentication
- Signup and login with email and password
- Passwords hashed with bcrypt
- JWT token issued on login, stored in localStorage
- Token auto-attached to all API requests via Authorization header

### Organisations
- Any user can create an organisation and becomes its admin
- Role is per-organisation, not global — same user can be admin in one org and member in another
- Org invite code displayed on the dashboard for admins to share

### Projects
- Admins can create and delete projects within their org
- All org projects are visible to members, but access is gated
- Members request access per project
- Admins approve or reject requests from the Requests page

### Project Invite Codes
- Admin generates a unique 16-character one-time code per project from the Members page
- Code is displayed on the project board (visible to admin only)
- Member pastes the code on the Home page → Join via Invite
- Code use creates a pending org membership + pending project access request simultaneously
- Admin approves from the Requests page
- Code is invalidated after single use

### Task Management
- Tasks have title, description, priority (High/Medium/Low), due date, and assignee
- Assignee must be an approved project member
- Drag-and-drop between columns (To Do / In Progress / Done)
- Admin can reassign and delete any task
- Members can only update status of tasks assigned to them

### Dashboard & Stats
- Organisation dashboard shows all projects and member count
- Stats page shows completion ratio, overdue vs upcoming, tasks created over time
- My Tasks page shows all tasks assigned to the logged-in user across approved projects

### RBAC (enforced server-side)
- Every API endpoint verifies the JWT and checks org/project membership
- Admin-only actions: create/delete projects, approve/reject requests, generate invite codes, reassign/delete tasks
- Member actions: view approved projects, create tasks, update own task status

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login, receive JWT |
| GET | /api/orgs/ | List user's orgs |
| POST | /api/orgs/create | Create org (becomes admin) |
| POST | /api/orgs/join | Join org via org invite code |
| POST | /api/orgs/{org_id}/invite | Invite user to org by email |
| GET | /api/projects/org/{org_id} | List projects in org |
| POST | /api/projects/org/{org_id} | Create project (admin) |
| DELETE | /api/projects/{project_id} | Delete project (admin) |
| POST | /api/projects/request-access | Request project access |
| POST | /api/projects/use-code | Use project invite code |
| POST | /api/projects/{project_id}/generate-code | Generate invite code (admin) |
| GET | /api/projects/{project_id}/board | Get board data (tasks + members) |
| GET | /api/requests/org/{org_id} | Get pending requests (admin) |
| POST | /api/requests/decision | Approve or reject request (admin) |
| POST | /api/tasks/ | Create task |
| PATCH | /api/tasks/{task_id}/status | Update task status |
| PATCH | /api/tasks/{task_id}/assignee | Reassign task (admin) |
| DELETE | /api/tasks/{task_id} | Delete task (admin) |

---

## Demo Walkthrough

### Admin flow

1. **Sign up** at `/auth` → create account
2. **Create an organisation** from the Home page → you become admin, a default "Launch Board" project is created
3. **Go to Members page** → select a project → click "Generate Code" → a 16-char invite code is generated
4. **Open the project board** → copy the invite code from the card above the task form
5. **Share the code** with the member
6. **Create tasks** on the board → assign to yourself or approved members
7. **Go to Requests page** → approve or reject incoming access requests
8. **Drag tasks** between columns to update status

### Member flow

1. **Sign up** at `/auth` → create account
2. **Go to Home page** → "Join via Invite" tab → paste the 16-char code → submit
3. Your request is now **pending** — you are added to the org but not the project yet
4. Wait for admin approval
5. Once approved, **log back in** → go to Projects → open the project
6. View the board, create tasks assigned to yourself, update status of your own tasks
7. **My Tasks page** shows all tasks assigned to you across all approved projects

---

## Local Setup

### Backend

```bash
cd server
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create `server/.env`:
```
DATABASE_URL=postgresql://postgres.[project-id]:[password]@[host]:5432/postgres
JWT_SECRET=your-secret-key
```

```bash
python -m uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`  
API docs at `http://localhost:8000/docs`

### Frontend

```bash
cd ..   # project root
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Deployment

### Backend (Render)
1. Connect GitHub repo to Render
2. New Web Service → select `server/` as root
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `DATABASE_URL`, `JWT_SECRET`

### Frontend (Vercel/Netlify)
1. Connect GitHub repo
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variable: `VITE_API_BASE_URL=https://your-render-url.onrender.com/api`

---

## Design Decisions

- **Role is per-org, not per-user** — same account can be admin in one org and member in another. No role selection at signup.
- **Project access requires explicit approval** — org membership alone does not grant project access. Each project requires a separate approval.
- **One-time invite codes** — project invite codes are single-use and invalidated after use to prevent sharing leaks.
- **Session Pooler for Supabase** — used instead of direct connection for IPv4 compatibility with Render.
- **No Alembic migrations** — tables are created via SQLAlchemy `create_all` on startup. Acceptable for an assignment; production would use Alembic.
