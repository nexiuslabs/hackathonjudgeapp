# Hackathon Judge App

A comprehensive judging application for hackathon events with offline support, real-time scoring, and administrative controls.

## Features

- Magic link authentication with role-based access control
- Offline-first architecture with PWA support
- Real-time scoring and rankings
- Admin console for event management
- Timer controls for presentations
- Mobile-responsive design

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Update the following variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_APP_URL`: Your app URL (production domain or `http://localhost:5173` for development)

### 3. Set Up Supabase Authentication

Follow the complete setup guide in [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) to:
- Configure magic link redirects
- Apply database migrations
- Create users and assign roles

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## User Roles

The application supports different user roles with varying levels of access:

- **judge**: Standard judge with scoring access
- **head_judge**: Lead judge with admin console access
- **operations**: Operations team with event management capabilities
- **admin**: Full administrative access
- **owner**: Highest level access with all permissions

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Authentication Setup

### Configure Supabase

1. Set Site URL in Supabase Dashboard:
   - Go to Authentication → URL Configuration
   - Set Site URL to your production domain

2. Add Redirect URLs:
   - Add `http://localhost:5173/**` for development
   - Add `https://yourdomain.com/**` for production

3. Apply migrations:
   ```bash
   supabase db push
   ```

### Assign User Roles

After creating users in Supabase, assign roles using SQL:

```sql
SELECT set_user_role(
  'user@example.com',
  'admin',
  'demo-event'
);
```

See [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) for detailed instructions.

## Project Structure

```
src/
├── components/       # React components
│   ├── auth/        # Authentication components
│   ├── brief/       # Event brief components
│   ├── layout/      # Layout components
│   ├── rankings/    # Rankings display
│   ├── score/       # Scoring interface
│   ├── timer/       # Timer controls
│   └── ui/          # Reusable UI components
├── config/          # Configuration files
├── contexts/        # React contexts
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and API
├── pages/           # Page components
├── types/           # TypeScript type definitions
└── test/            # Test utilities

supabase/
├── migrations/      # Database migrations
└── seed.sql         # Seed data examples
```

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Environment Variables for Production

Ensure these environment variables are set in your deployment platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL` (must match your production domain)

### Deploy to Netlify, Vercel, or Similar

1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy

## Troubleshooting

### Magic Links Redirect to Wrong URL (localhost:3000)

**Problem**: When clicking magic links, you're redirected to `http://localhost:3000` with an access token in the URL.

**Root Cause**: The Supabase Site URL is set to `localhost:3000` instead of your actual app URL.

**Solution**:
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Update **Site URL** to `http://localhost:5173` (or your production URL)
3. Add `http://localhost:5173/**` to **Redirect URLs** whitelist
4. Save and request a NEW magic link

📖 **See [MAGIC_LINK_FIX.md](./MAGIC_LINK_FIX.md) for complete troubleshooting guide.**

### Cannot Access Admin Pages

**Solution**: Verify user has correct role assigned. Run:
```sql
SELECT email, raw_app_meta_data->>'role' FROM auth.users WHERE email = 'your@email.com';
```

### Offline Mode Not Working

**Solution**: Ensure you're accessing the app over HTTPS (or localhost). Service Workers require a secure context.

## Documentation

- [Supabase Auth Setup Guide](./SUPABASE_AUTH_SETUP.md) - Complete authentication setup
- [Seed Data Examples](./supabase/seed.sql) - Example role assignments

## License

MIT
