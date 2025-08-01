# VAPI Next.js Application

A Next.js application integrated with VAPI for voice chatbots, Clerk for authentication, and Prisma for database management.

## Features

- 🎙️ Voice chatbot integration with VAPI
- 🔐 Authentication with Clerk
- 🗄️ Database management with Prisma
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design
- 🚀 Optimized for Vercel deployment

## Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (recommended: Vercel Postgres, Supabase, or Neon)
- Clerk account for authentication
- VAPI account for voice features

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vapi-nextjs-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your actual values in `.env.local`:
   - Clerk keys from your Clerk dashboard
   - VAPI keys from your VAPI dashboard
   - Database URL from your PostgreSQL provider
   - Other optional configurations

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Prerequisites for Deployment

1. **GitHub Repository**: Push your code to GitHub
2. **Database**: Set up a PostgreSQL database (recommended providers):
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - [Supabase](https://supabase.com/)
   - [Neon](https://neon.tech/)
   - [PlanetScale](https://planetscale.com/)

### Deployment Steps

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js project

2. **Configure Environment Variables**
   In your Vercel project settings, add these environment variables:
   
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
   VAPI_PRIVATE_KEY=your_vapi_private_key
   NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id
   DATABASE_URL=postgresql://...
   ```

3. **Deploy**
   - Click "Deploy" in Vercel
   - Vercel will automatically build and deploy your application
   - The `vercel.json` configuration will handle Prisma setup automatically

### Database Migration

After deployment, you may need to run database migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma db push
```

## Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── chatbot-voice/  # Voice chatbot pages
│   │   └── ...
│   ├── components/         # Reusable components
│   ├── lib/               # Utility functions
│   └── middleware.ts      # Middleware configuration
├── prisma/
│   └── schema.prisma      # Database schema
├── public/                # Static assets
├── vercel.json           # Vercel configuration
└── ...
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | VAPI public key | Yes |
| `VAPI_PRIVATE_KEY` | VAPI private key | Yes |
| `NEXT_PUBLIC_VAPI_ASSISTANT_ID` | VAPI assistant ID | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GOOGLE_SHARED_DRIVE_ID` | Google Drive ID (optional) | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (if using Supabase) | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (if using Supabase) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (if using Supabase) | No |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations

## Troubleshooting

### Common Issues

1. **Prisma Client Not Generated**
   ```bash
   npx prisma generate
   ```

2. **Database Connection Issues**
   - Verify your `DATABASE_URL` is correct
   - Ensure your database allows connections from Vercel's IP ranges

3. **Environment Variables Not Loading**
   - Check that all required environment variables are set in Vercel
   - Ensure variable names match exactly (case-sensitive)

4. **Build Failures**
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are listed in `package.json`

## Support

For issues related to:
- **VAPI**: Check [VAPI documentation](https://docs.vapi.ai/)
- **Clerk**: Check [Clerk documentation](https://clerk.com/docs)
- **Prisma**: Check [Prisma documentation](https://www.prisma.io/docs)
- **Vercel**: Check [Vercel documentation](https://vercel.com/docs)

## License

This project is private and proprietary.