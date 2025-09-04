# Copying from Replit to Local

## Step 1: Get Environment Variables from Replit

### From Replit Console/Secrets Tab:

1. **Go to your Replit project**
2. **Click on "Secrets" tab** (lock icon in left panel)
3. **Copy these values exactly:**

```bash
# Required - Copy these from Replit
DATABASE_URL=postgresql://neondb_owner:npg_rduiCeQ6VYM1@ep-blue-rain-a6mwd0y9.us-west-2.aws.neon.tech/neondb?sslmode=require
OPENAI_API_KEY=sk-your-actual-openai-key-here
SESSION_SECRET=your-actual-session-secret
```

### Alternative: Check Replit Shell
```bash
# In Replit shell, run:
echo $DATABASE_URL
echo $OPENAI_API_KEY  
echo $SESSION_SECRET
```

## Step 2: Update Local Environment

**Replace values in your local `.env` file:**

```bash
# Open .env file and update these lines with your actual values from Replit:
DATABASE_URL="your-actual-database-url-from-replit"
OPENAI_API_KEY="your-actual-openai-key-from-replit"
SESSION_SECRET="your-actual-session-secret-from-replit"
```

## Step 3: Install Dependencies & Run

```bash
# Install Python dependencies
pip install -r requirements.txt
# OR if you have uv: uv sync

# Install Node dependencies (already done)
npm install

# Start the application
python start_integrated_system.py
```

## Step 4: Test Connection

The system will start on:
- **Frontend**: http://localhost:5000
- **Backend**: http://localhost:8001  
- **API Docs**: http://localhost:8001/docs

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is exactly the same as in Replit
- Check if your IP needs to be whitelisted in Neon dashboard
- Test connection: `python -c "import psycopg2; print('Connection OK')"`

### OpenAI API Issues  
- Verify API key starts with `sk-`
- Check API key has sufficient credits
- Test: `python -c "from openai import OpenAI; print('API OK')"`

### Port Conflicts
- Change PORT=5000 to PORT=3000 if needed
- Update start_integrated_system.py ports if necessary

## What NOT to Copy
- `node_modules/` folder
- `.git/` folder (you already have this)
- Replit-specific config files
- Any temp/cache files