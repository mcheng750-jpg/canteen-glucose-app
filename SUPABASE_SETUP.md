# Supabase setup

This app can run without Supabase, but cloud records need these steps.

1. Create a Supabase project.

2. Open Supabase SQL Editor and run `supabase-schema.sql`.

3. In Supabase, open Authentication > Providers and keep Email enabled.

4. Copy Project URL and anon public key from Project Settings > API.

5. For local development, create `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

6. For Vercel, add the same two environment variables in Project Settings > Environment Variables, then redeploy.

The first cloud version supports:

- Email/password sign up and sign in
- Insert one glucose record
- Fetch the current user's own records
- Row level security so users can only read and write their own records
