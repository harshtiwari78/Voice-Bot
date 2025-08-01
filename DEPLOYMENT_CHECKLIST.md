# Vercel Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Repository
- [ ] Code is pushed to GitHub repository
- [ ] Repository is public or you have Vercel access to private repos
- [ ] All Azure-specific files removed (web.config, startup.sh, server.js)
- [ ] .gitignore updated for Vercel

### 2. Environment Variables Setup
- [ ] Clerk account created and configured
  - [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY obtained
  - [ ] CLERK_SECRET_KEY obtained
- [ ] VAPI account created and configured
  - [ ] NEXT_PUBLIC_VAPI_PUBLIC_KEY obtained
  - [ ] VAPI_PRIVATE_KEY obtained
  - [ ] NEXT_PUBLIC_VAPI_ASSISTANT_ID obtained
- [ ] Database setup (choose one):
  - [ ] Vercel Postgres
  - [ ] Supabase
  - [ ] Neon
  - [ ] PlanetScale
  - [ ] Other PostgreSQL provider
- [ ] DATABASE_URL connection string obtained

### 3. Optional Services
- [ ] Google Drive integration (if needed)
  - [ ] GOOGLE_SHARED_DRIVE_ID configured
- [ ] Supabase integration (if using)
  - [ ] NEXT_PUBLIC_SUPABASE_URL configured
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY configured
  - [ ] SUPABASE_SERVICE_ROLE_KEY configured

## Deployment Steps

### 1. Vercel Setup
- [ ] Go to [vercel.com](https://vercel.com) and sign in
- [ ] Click "New Project"
- [ ] Import your GitHub repository
- [ ] Vercel auto-detects Next.js configuration

### 2. Environment Variables Configuration
In Vercel project settings → Environment Variables, add:

**Required Variables:**
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
- [ ] `VAPI_PRIVATE_KEY`
- [ ] `NEXT_PUBLIC_VAPI_ASSISTANT_ID`
- [ ] `DATABASE_URL`

**Optional Variables:**
- [ ] `GOOGLE_SHARED_DRIVE_ID`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### 3. Deploy
- [ ] Click "Deploy" in Vercel
- [ ] Wait for build to complete
- [ ] Check deployment logs for any errors

### 4. Post-Deployment
- [ ] Test the deployed application
- [ ] Verify authentication works
- [ ] Test voice chatbot functionality
- [ ] Check database connectivity
- [ ] Verify all API endpoints work

## Database Migration (if needed)

If you need to run database migrations after deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull .env.local

# Run Prisma commands
npx prisma generate
npx prisma db push
```

## Troubleshooting

### Build Failures
- [ ] Check build logs in Vercel dashboard
- [ ] Verify all environment variables are set
- [ ] Ensure DATABASE_URL is accessible from Vercel

### Runtime Errors
- [ ] Check function logs in Vercel dashboard
- [ ] Verify database connection
- [ ] Check API endpoint responses

### Authentication Issues
- [ ] Verify Clerk keys are correct
- [ ] Check Clerk dashboard for domain configuration
- [ ] Ensure redirect URLs are updated in Clerk

### VAPI Integration Issues
- [ ] Verify VAPI keys are correct
- [ ] Check VAPI dashboard for assistant configuration
- [ ] Test voice functionality

## Success Criteria

- [ ] Application builds successfully
- [ ] Application deploys without errors
- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] Voice chatbot functionality works
- [ ] Database operations work
- [ ] All API endpoints respond correctly

## Next Steps After Successful Deployment

1. **Custom Domain** (optional)
   - Configure custom domain in Vercel settings
   - Update DNS records
   - Update Clerk allowed origins

2. **Monitoring**
   - Set up Vercel Analytics
   - Configure error tracking
   - Set up uptime monitoring

3. **Performance Optimization**
   - Review Core Web Vitals
   - Optimize images and assets
   - Configure caching strategies

4. **Security**
   - Review security headers
   - Configure CORS if needed
   - Set up rate limiting

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Clerk with Vercel](https://clerk.com/docs/deployments/deploy-to-vercel)