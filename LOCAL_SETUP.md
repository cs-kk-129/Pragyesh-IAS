# Local Development Setup Guide

## Prerequisites

### Required Software
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (3.11 or higher) - [Download here](https://www.python.org/)
- **Git** - [Download here](https://git-scm.com/)

### Optional
- **PostgreSQL** (for local database) - [Download here](https://www.postgresql.org/)

## Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (using uv - faster)
# If you don't have uv, install it first: pip install uv
pip install uv
uv sync

# Or use pip directly
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env .env.local
```

Update the following variables in `.env.local`:
- `OPENAI_API_KEY` - Your OpenAI API key
- `DATABASE_URL` - Your database connection string
- `SESSION_SECRET` - A secure random string

### 3. Database Setup

If using local PostgreSQL:
```bash
# Create database
createdb upsc_evaluation

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/upsc_evaluation"

# Run migrations
npm run db:push
```

### 4. Start Development Servers

**Option A: Start both services together (Recommended)**
```bash
python start_integrated_system.py
```

**Option B: Start services separately**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend
python run_backend.py
```

## Development URLs

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

## Available Scripts

### Frontend (Node.js/React)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run dev:client` - Start only React client
- `npm run dev:server` - Start only Express server

### Backend (Python/FastAPI)
- `cd backend && python run_backend.py` - Start FastAPI server
- `python start_integrated_system.py` - Start both frontend and backend

### Database
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open database studio
- `npm run db:generate` - Generate migrations

## Project Structure

```
├── client/          # React frontend components
├── server/          # Express.js server
├── backend/         # FastAPI Python backend
├── shared/          # Shared types and utilities
├── attached_assets/ # Static assets and data
└── start_integrated_system.py # Development startup script
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `.env` file
2. **Database connection**: Ensure DATABASE_URL is correct
3. **Python dependencies**: Use `uv sync` or `pip install -r requirements.txt`
4. **Node dependencies**: Delete `node_modules` and run `npm install`

### Logs
- Frontend logs: Check browser console
- Backend logs: Check terminal running FastAPI server
- Integration logs: Check terminal running `start_integrated_system.py`