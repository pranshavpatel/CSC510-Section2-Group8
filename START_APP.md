# Quick Start Guide 🚀

## Prerequisites
- Python 3.11+
- Node.js 20+
- Git

## 1. Clone Repository
```bash
git clone https://github.com/pranshavpatel/CSC510-Section2-Group8.git
cd CSC510-Section2-Group8/Project
```

## 2. Backend Setup

### Install Dependencies
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Configure Environment
Create `.env` file:
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/vibedish

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Spotify
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/spotify/callback
SPOTIFY_SCOPES=user-read-recently-played,user-read-currently-playing

# AI
GROQ_API_KEY=your-groq-key

# AWS/S3 (Optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_ENDPOINT_URL=your-endpoint
S3_BUCKET_NAME=your-bucket
```

### Run Database Migrations
```bash
alembic upgrade head
```

### Start Backend
```bash
uvicorn app.main:app --reload
```

Backend: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

## 3. Frontend Setup

### Install Dependencies
```bash
cd client
npm install
```

### Configure Environment
Create `client/.env`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

### Start Frontend
```bash
npm run dev
```

Frontend: **http://localhost:3000**

## 4. Verify Installation

### Check Backend
```bash
curl http://localhost:8000/health
```

### Check Frontend
Open browser: http://localhost:3000

## Quick Test

### Create Test User
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Verify all environment variables are set
- Run: `pip install -r requirements.txt` again

### Frontend won't start
- Check Node.js version: `node -v` (should be 20+)
- Delete `node_modules` and `.next`, then `npm install`
- Verify NEXT_PUBLIC_API_URL points to backend

### Database connection error
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Run migrations: `alembic upgrade head`

### Port already in use
Backend:
```bash
uvicorn app.main:app --reload --port 8001
```

Frontend:
```bash
npm run dev -- -p 3001
```

## Development Mode

### Hot Reload
Both backend and frontend support hot reload:
- Backend: Changes auto-reload with `--reload` flag
- Frontend: Changes auto-refresh in browser

### View Logs
Backend: Terminal running uvicorn  
Frontend: Browser console + Terminal

## Production Build

### Backend
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
```bash
cd client
npm run build
npm start
```

## Next Steps
- Read [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for usage walkthrough
- Read [TEST_COMMANDS.md](TEST_COMMANDS.md) for testing
- Check API docs at http://localhost:8000/docs
