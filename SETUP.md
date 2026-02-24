# Homeplay AI Course Survey — Setup Guide

## 1. Supabase Setup

Go to [supabase.com](https://supabase.com), open your project (or create a new one), then go to the **SQL Editor** and run this:

```sql
-- Create the responses table
create table responses (
  id bigint generated always as identity primary key,
  overall int,
  relevance int,
  confidence int,
  useful_topics text[] default '{}',
  would_recommend int,
  feedback text,
  created_at timestamptz default now()
);

-- Allow anyone to insert (survey is anonymous, no auth needed)
alter table responses enable row level security;

create policy "Allow anonymous inserts"
  on responses for insert
  to anon
  with check (true);

create policy "Allow anonymous reads"
  on responses for select
  to anon
  using (true);

-- Enable real-time for the results dashboard
alter publication supabase_realtime add table responses;
```

Then go to **Settings → API** and copy:
- **Project URL** (e.g. `https://abc123.supabase.co`)
- **anon/public key** (the long `eyJ...` string)


## 2. GitHub Setup

Push this folder to a new GitHub repo:

```bash
cd ai-course-survey
git init
git branch -m main
git add -A
git commit -m "Initial commit"
gh repo create ai-course-survey --public --push --source .
```

Or create the repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-course-survey.git
git push -u origin main
```


## 3. Vercel Setup

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import the `ai-course-survey` repo from GitHub
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click **Deploy**

Once deployed you'll get a URL like `https://ai-course-survey.vercel.app`.
You can also add a custom domain from your Vercel dashboard.


## 4. Using It on Thursday

Two URLs to know:

| URL | Purpose |
|-----|---------|
| `yoursite.com/` | **Survey** — attendees open this on their phones |
| `yoursite.com/results` | **Live dashboard** — put this on a big screen |

Generate a QR code for the survey URL (search "QR code generator" — any free one works) and display it during the session so people can scan and fill it in.

The results page updates in real-time via Supabase subscriptions — as each person submits, their response appears on the dashboard immediately.
