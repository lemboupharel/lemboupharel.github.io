# Vercel KV Setup Instructions

## Step 1: Create KV Database in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your portfolio project
3. Click on **Storage** tab
4. Click **Create Database**
5. Select **KV (Redis)**
6. Give it a name (e.g., "portfolio-kv")
7. Click **Create**

## Step 2: Environment Variables (Automatic)

Vercel will automatically add these environment variables to your project:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

**No manual configuration needed!** ✅

## Step 3: Initial Data Seeding

After deploying, seed your initial data:

```bash
# Call this endpoint once after deployment
curl -X POST https://your-site.vercel.app/api/admin/seed
```

Or visit in your browser:
```
https://your-site.vercel.app/api/admin/seed
```

This will populate the database with sample projects and certificates.

## Step 4: Local Development (Optional)

To test KV locally, you need to pull the environment variables:

```bash
# Install Vercel CLI (if not already)
npm i -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run locally
npm run dev
```

## Step 5: Deploy

```bash
git add .
git commit -m "Migrate to Vercel KV storage"
git push
```

Vercel will auto-deploy!

## Testing the Deployment

1. Visit your admin panel: `https://your-site.vercel.app/admin`
2. Login with password: `change_me_later`
3. Try adding, editing, and deleting items
4. All operations should work now! ✅

## Troubleshooting

**Error: "Failed to fetch data"**
- Make sure KV database is created in Vercel dashboard
- Check that environment variables are set (they should be automatic)

**Error: "KV is not defined"**
- Run `npm install` to ensure `@vercel/kv` is installed
- Redeploy the project

**Local development not working:**
- Run `vercel env pull .env.local` to get environment variables
- Make sure `.env.local` is in `.gitignore`

## What Changed

### Before (File-based):
```javascript
const fs = require("fs");
const data = fs.readFileSync("data.json");
fs.writeFileSync("data.json", JSON.stringify(data));
```
❌ Doesn't work on Vercel (read-only filesystem)

### After (KV-based):
```javascript
const { kv } = require("@vercel/kv");
const data = await kv.get("portfolio_data");
await kv.set("portfolio_data", data);
```
✅ Works on Vercel (cloud storage)

## Benefits

✅ **Persistent storage** - Data survives deployments  
✅ **Fast** - Redis-based, millisecond latency  
✅ **Scalable** - Handles concurrent requests  
✅ **Free tier** - 256MB storage, 10k requests/day  
✅ **No config** - Environment variables auto-set
