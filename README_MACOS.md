# macOS Setup Guide - UPSC Evaluation System

## Prerequisites

### Install Required Software

1. **Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Node.js** (v16 or higher):
   ```bash
   brew install node
   ```

3. **Python** (3.11 or higher):
   ```bash
   brew install python@3.11
   ```

4. **Git** (usually pre-installed on macOS):
   ```bash
   git --version
   # If not installed: brew install git
   ```

### Verify Installations
```bash
node --version    # Should show v16 or higher
python3 --version # Should show 3.11 or higher
npm --version     # Should be installed with Node.js
```

## Quick Start

### 1. Clone and Navigate to Project
```bash
git clone <your-repo-url>
cd Pragyesh-IAS
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip3 install -r requirements.txt

# Optional: Use uv for faster Python package management
pip3 install uv
uv sync
```

### 3. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
# Or use your preferred editor: code .env, vim .env, etc.
```

Required environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `DATABASE_URL` - Database connection string
- `SESSION_SECRET` - Secure random string for sessions

### 4. Start the Application

**Option A: Integrated System (Recommended)**
```bash
python3 start_integrated_system.py
```

**Option B: Start Services Separately**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend (in new terminal)
cd backend
python3 run_backend.py
```

## Access Your Application

Once started, access these URLs:
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

## Available Scripts

### Frontend (Node.js/React)
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run dev:client # Start only React client
npm run dev:server # Start only Express server
```

### Backend (Python/FastAPI)
```bash
cd backend && python3 run_backend.py  # Start FastAPI server
python3 start_integrated_system.py    # Start both services
```

### Database Operations
```bash
npm run db:push     # Push schema changes
npm run db:studio   # Open database studio
npm run db:generate # Generate migrations
```

## Troubleshooting

### Common macOS Issues

1. **Python Version Conflicts**
   ```bash
   # Check which python3 you're using
   which python3
   
   # If issues with system Python, use Homebrew Python explicitly
   /opt/homebrew/bin/python3 start_integrated_system.py
   ```

2. **Permission Issues**
   ```bash
   # If pip install fails with permissions
   pip3 install --user -r requirements.txt
   ```

3. **Port Already in Use**
   ```bash
   # Check what's using port 5000 or 8001
   lsof -i :5000
   lsof -i :8001
   
   # Kill process if needed
   kill -9 <PID>
   ```

4. **Node.js Issues**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Performance Tips for macOS

1. **Use faster package managers:**
   ```bash
   # For Python packages
   pip3 install uv
   uv sync  # Instead of pip install -r requirements.txt
   
   # For Node.js packages  
   npm install -g pnpm
   pnpm install  # Instead of npm install
   ```

2. **Terminal Performance:**
   - Use iTerm2 instead of default Terminal
   - Enable "Use GPU rendering" in Terminal preferences

## Development Environment

### Recommended macOS Development Tools
```bash
# VS Code (recommended editor)
brew install --cask visual-studio-code

# Optional: Database management
brew install --cask dbeaver-community

# Optional: API testing
brew install --cask insomnia
```

### VS Code Extensions
- Python
- JavaScript/TypeScript
- Prettier
- ESLint
- GitLens

## System Requirements

- **macOS**: 10.15 (Catalina) or later
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for dependencies
- **Internet**: Required for API calls and package installation

## Features Available

- Advanced mock test evaluation with AI recommendations
- PDF report generation with detailed analysis
- Subject-wise and topic-wise performance tracking
- Time management analysis
- Personalized study recommendations

## Getting Help

If you encounter issues:

1. Check the logs in Terminal
2. Verify all prerequisites are installed correctly
3. Ensure environment variables are set properly
4. Check that ports 5000 and 8001 are available

## Stopping the Application

- **Integrated System**: Press `Ctrl+C` in the terminal
- **Separate Services**: Press `Ctrl+C` in each terminal window

The system will gracefully shut down both frontend and backend services.