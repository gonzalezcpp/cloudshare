<div align="center">

# CloudShare

### Secure Cloud File Storage & Sharing

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://prisma.io)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**Live Demo:** [cloudshare-liart.vercel.app](https://cloudshare-liart.vercel.app)

---

Upload, organize, and share files with optional PIN-protected links. Simple, secure, and beautiful.

</div>

---

## Features

| Feature | Description |
|---------|-------------|
| **Cloud Storage** | Upload files up to 50MB with drag-and-drop support |
| **File Management** | Rename, move, delete files and create folders |
| **Share Links** | Generate secure shareable links for any file |
| **PIN Protection** | Optional 6-character PIN for extra security |
| **QR Codes** | Generate QR codes for share links - scan to download |
| **Download History** | Track all downloads with timestamps |
| **Google OAuth** | Sign in with your Google account |
| **Responsive Design** | Works perfectly on desktop and mobile |

## Screenshots

<div align="center">

![Landing Page](https://via.placeholder.com/800x400/f8fafc/2563eb?text=CloudShare+Landing+Page)
*Landing page with clean, modern design*

![Dashboard](https://via.placeholder.com/800x400/f8fafc/2563eb?text=Dashboard+with+3-Column+Layout)
*Dashboard with stats, recent files, and quick actions*

![Download Page](https://via.placeholder.com/800x400/f8fafc/2563eb?text=Download+Page)
*MediaFire-inspired download page with file details*

</div>

## Tech Stack

```
Frontend    →  Next.js 14, React 18, TypeScript
Styling     →  Tailwind CSS
Database    →  PostgreSQL (Neon)
ORM         →  Prisma 5
Auth        →  NextAuth.js (Credentials + Google OAuth)
Storage     →  Supabase Storage / S3-compatible
Deployment  →  Vercel
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- [Supabase](https://supabase.com) account (for file storage)

### 1. Clone the repository

```bash
git clone https://github.com/gonzalezcpp/cloudshare.git
cd cloudshare
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/cloudshare"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Supabase Storage (optional)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-key"
SUPABASE_BUCKET="your-bucket-name"
```

### 4. Initialize database

```bash
npx prisma generate
npx prisma db push
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
cloudshare/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & signup pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/       # Authenticated pages
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── files/         # File manager
│   │   │   ├── shared/        # Shared links
│   │   │   └── settings/      # User settings
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication
│   │   │   ├── dashboard/     # Dashboard stats
│   │   │   ├── download/      # File downloads
│   │   │   ├── downloads/     # Download history
│   │   │   ├── files/         # File operations
│   │   │   ├── share/         # Share link management
│   │   │   └── user/          # User profile
│   │   ├── d/[token]/         # Public download page
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── BrandLogo.tsx
│   │   ├── Sidebar.tsx
│   │   ├── FileUploader.tsx
│   │   ├── FileCard.tsx
│   │   ├── ShareDialog.tsx    # Includes QR code generation
│   │   └── ...
│   ├── lib/                   # Utilities & configs
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client
│   │   ├── s3.ts              # S3/R2 integration
│   │   ├── storage.ts         # Supabase storage
│   │   ├── pins.ts            # PIN hashing & verification
│   │   └── rateLimit.ts       # Rate limiting
│   └── types/                 # TypeScript types
└── tailwind.config.ts         # Tailwind configuration
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create new account |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth handlers |
| `GET` | `/api/dashboard` | Get dashboard stats |
| `GET` | `/api/files` | List files (with search & sort) |
| `POST` | `/api/files/upload` | Get upload presigned URL |
| `POST` | `/api/files/upload/confirm` | Confirm file upload |
| `DELETE` | `/api/files/[id]` | Delete a file |
| `POST` | `/api/folders` | Create a folder |
| `POST` | `/api/share` | Create share link |
| `GET` | `/api/share` | List share links |
| `DELETE` | `/api/share/[id]` | Delete share link |
| `GET` | `/api/download/[token]` | Get file download info |
| `POST` | `/api/download/[token]` | Verify PIN & download |
| `GET` | `/api/downloads` | Get download history |
| `PATCH` | `/api/user/profile` | Update username |
| `PATCH` | `/api/user/password` | Change password |

## Security

- **Password hashing** - bcrypt with 12 salt rounds
- **PIN hashing** - bcrypt with 12 salt rounds
- **Rate limiting** - 5 PIN attempts per 15 minutes per IP
- **Secure tokens** - 32-byte random share tokens
- **JWT sessions** - Stateless authentication
- **Server-side auth** - All file operations verified

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

The `vercel.json` is pre-configured:

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build"
}
```

### Environment Variables for Production

```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with Next.js, TypeScript, and Tailwind CSS**

[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://vercel.com)

</div>
