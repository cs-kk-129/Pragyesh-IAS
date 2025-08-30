# Pragyesh IAS

A full-stack educational platform for IAS preparation with modern web technologies.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM (Neon)
- **Authentication**: Passport.js
- **AI Integration**: OpenAI API
- **File Processing**: PDF and Word document handling

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. Push database schema:
```bash
npm run db:push
```

4. Start development servers:
```bash
# Run everything together
npm run dev:all

# Or run separately
npm run dev:server  # Server on port 3000
npm run dev:client  # Client on port 5173
```

## Available Scripts

- `npm run dev:server` - Start Express server
- `npm run dev:client` - Start Vite client
- `npm run dev:all` - Start both server and client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open database GUI
- `npm run build` - Build for production

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and utilities
├── config/          # Configuration files
└── README.md
```
