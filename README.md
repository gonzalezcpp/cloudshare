# CloudShare

A modern cloud file-storage and file-sharing web application with optional Secret PIN protection.

## Features

- **User Accounts**: Sign up, log in, and manage your profile
- **File Upload**: Drag-and-drop interface with progress indicators
- **File Management**: Rename, move, delete files, and create folders
- **File Sharing**: Generate share links with optional 6-character PIN protection
- **Secure Downloads**: PIN-protected downloads with rate limiting
- **Responsive UI**: Works on desktop and mobile devices
- **Dark Mode**: Toggle between light and dark themes

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: S3-compatible object storage
- **Authentication**: NextAuth.js with JWT sessions

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- S3-compatible storage (AWS S3, MinIO, etc.)

## Setup Instructions

### 1. Clone and Install

```bash
cd cloudshare
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for JWT signing
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: S3 credentials
- `S3_BUCKET_NAME`: Your S3 bucket name

### 3. Initialize Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Seed Demo User (Optional)

```bash
npx prisma db seed
```

This creates a demo account:
- Email: `demo@cloudshare.com`
- Password: `password123`

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Production Deployment

### Build

```bash
npm run build
```

### Start

```bash
npm start
```

### Environment Variables for Production

Ensure these are set in production:

```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Project Structure

```
cloudshare/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeder
├── src/
│   ├── app/
│   │   ├── (auth)/        # Login/signup pages
│   │   ├── (dashboard)/   # Authenticated pages
│   │   ├── api/           # API routes
│   │   └── d/[token]/     # Download page
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities and configs
│   └── types/             # TypeScript types
└── public/                # Static assets
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- PIN hashing with bcrypt (12 rounds)
- Rate limiting on PIN verification (5 attempts per 15 minutes)
- Server-side authorization on all file operations
- Secure random share tokens (32 bytes)
- JWT-based session management
- No sensitive data exposed in URLs

## API Endpoints

- `POST /api/auth/signup` - Create account
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET /api/files` - List files
- `POST /api/files/upload` - Upload file
- `PATCH /api/files/[id]` - Update file
- `DELETE /api/files/[id]` - Delete file
- `POST /api/folders` - Create folder
- `GET /api/folders` - List folders
- `POST /api/share` - Create share link
- `GET /api/share` - List share links
- `DELETE /api/share/[id]` - Delete share link
- `GET /api/download/[token]` - Get download info
- `POST /api/download/[token]` - Download/verify PIN

## License

MIT
