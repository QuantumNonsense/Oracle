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

## MycOracle Support Page

The public support page is available at:

https://quantumnonsense.com/mycoracle-support

Its dependency-free source lives in `public/mycoracle-support/index.html` and
is copied into the Expo web export without affecting native Expo or EAS builds.
External app URLs and the support email address are centralized in
`src/constants/links.ts`.

Preview the page locally from the repository root:

```bash
python3 -m http.server 4173 --directory public
```

Then open `http://localhost:4173/mycoracle-support/`.

The root `vercel.json` builds the Expo web target and maps
`/mycoracle-support` to the static support page before the app's catch-all
rewrite. Deploy the connected Vercel project with:

```bash
npx vercel --prod
```

In Vercel, ensure `quantumnonsense.com` is assigned to this project and that
its DNS records use the values Vercel provides. Domain assignment and DNS are
manual hosting steps and cannot be completed by this repository alone.

Enter `https://quantumnonsense.com/mycoracle-support` in App Store Connect's
**Support URL** field.
