# MyOracle

## Public Stats Page

The Expo web build renders a standalone public stats landing page at the root
route. For Vercel, set these public environment variables on the project:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://yppsqzyipyxbtqybjojm.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Use only the Supabase publishable/anon key for the stats page. Do not add a
service role key to the client app or Vercel public environment.
