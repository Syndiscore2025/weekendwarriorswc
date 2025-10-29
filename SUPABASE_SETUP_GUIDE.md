# Supabase Setup Guide for Weekend Warriors Wrestling Club

## Step 1: Create Supabase Account & Project

1. **Go to** https://supabase.com
2. **Click "Start your project"** (or "Sign in" if you have an account)
3. **Sign up** with GitHub, Google, or email
4. **Create a new project:**
   - Organization: Create new or select existing
   - Project name: `weekendwarriorswc` (or any name you like)
   - Database Password: **SAVE THIS PASSWORD** - you'll need it later
   - Region: Choose closest to you (e.g., `US East` or `US West`)
   - Pricing Plan: **Free** (perfect for starting)
5. **Click "Create new project"**
6. **Wait 2-3 minutes** for the project to provision

---

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click **Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. You'll see two important values:

### Copy these values:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```

**anon public key:** (long string starting with `eyJ...`)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY...
```

**Keep these safe!** You'll paste them into your code in Step 4.

---

## Step 3: Run the SQL to Create Tables

1. In Supabase dashboard, click **SQL Editor** (in left sidebar)
2. Click **"New query"**
3. **Copy and paste this entire SQL script:**

```sql
-- Tables
create table if not exists admins (
  email text primary key
);

create table if not exists schedule (
  id bigserial primary key,
  day text not null,
  time text not null,
  grp text not null,
  sort int default 0
);

create table if not exists tournaments (
  id bigserial primary key,
  date date not null,
  event text not null,
  location text not null,
  weighin_time text
);

create table if not exists slides (
  id bigserial primary key,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  caption text,
  storage_path text,
  sort int default 0,
  created_at timestamptz default now()
);

create table if not exists site_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

create table if not exists winter_signups_2025 (
  id bigserial primary key,
  parent_name text not null,
  wrestler_name text not null,
  wrestler_dob date not null,
  wrestler_grade text not null,
  phone text not null,
  email text not null,
  submitted_at timestamptz default now()
);

-- Storage bucket (run this in SQL or create via Storage UI)
insert into storage.buckets (id, name, public) 
values ('media', 'media', true)
on conflict (id) do nothing;

-- Enable RLS
alter table schedule enable row level security;
alter table tournaments enable row level security;
alter table admins enable row level security;
alter table slides enable row level security;
alter table site_settings enable row level security;
alter table winter_signups_2025 enable row level security;

-- Public read policies
create policy if not exists "public read schedule" on schedule for select using (true);
create policy if not exists "public read tournaments" on tournaments for select using (true);
create policy if not exists "public read slides" on slides for select using (true);
create policy if not exists "public read settings" on site_settings for select using (true);

-- Admin write policies
create policy if not exists "admins write schedule" on schedule for all using (
  exists(select 1 from admins a where a.email = auth.email())
);
create policy if not exists "admins write tournaments" on tournaments for all using (
  exists(select 1 from admins a where a.email = auth.email())
);
create policy if not exists "admins write slides" on slides for all using (
  exists(select 1 from admins a where a.email = auth.email())
);
create policy if not exists "admins write settings" on site_settings for all using (
  exists(select 1 from admins a where a.email = auth.email())
);

-- Winter signups policies (public can insert, admins can read/delete)
create policy if not exists "public insert winter signups" on winter_signups_2025 for insert with check (true);
create policy if not exists "admins read winter signups" on winter_signups_2025 for select using (
  exists(select 1 from admins a where a.email = auth.email())
);
create policy if not exists "admins delete winter signups" on winter_signups_2025 for delete using (
  exists(select 1 from admins a where a.email = auth.email())
);

-- Storage policies
create policy if not exists "public read media" on storage.objects for select using (bucket_id = 'media');
create policy if not exists "admins upload media" on storage.objects for insert with check (
  bucket_id = 'media' and exists(select 1 from admins a where a.email = auth.email())
);
create policy if not exists "admins delete media" on storage.objects for delete using (
  bucket_id = 'media' and exists(select 1 from admins a where a.email = auth.email())
);
```

4. **Click "Run"** (or press Ctrl+Enter / Cmd+Enter)
5. You should see **"Success. No rows returned"** - that's perfect!

---

## Step 4: Create Your Admin User

### 4a. Create Auth User

1. Click **Authentication** in left sidebar
2. Click **Users** tab
3. Click **"Add user"** → **"Create new user"**
4. Enter:
   - **Email:** your email address (e.g., `your@email.com`)
   - **Password:** create a strong password
   - **Auto Confirm User:** ✅ Check this box
5. Click **"Create user"**

### 4b. Add Email to Admins Table

1. Go back to **SQL Editor**
2. Create a new query
3. **Replace `your@email.com` with YOUR actual email:**

```sql
INSERT INTO admins (email) VALUES ('your@email.com');
```

4. **Click "Run"**
5. You should see **"Success. 1 rows affected"**

---

## Step 5: Update Your Website Code

Now you need to paste your Supabase credentials into TWO files:

### File 1: `admin.html`

1. Open `admin.html` in your code editor
2. Find lines 152-153 (near the top of the `<script>` section):

```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

3. **Replace with your actual values from Step 2:**

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY...';
```

### File 2: `index.html`

1. Open `index.html`
2. Find lines 59-60 (in the `<script type="module">` section):

```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

3. **Replace with the SAME values:**

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY...';
```

### File 3: `schedule.html`

1. Open `schedule.html`
2. Find lines 110-111 (in the `<script type="module">` section):

```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

3. **Replace with the SAME values**

---

## Step 6: Deploy to GitHub & Render

1. **Save all three files** (admin.html, index.html, schedule.html)
2. **Commit and push to GitHub:**

```bash
git add -A
git commit -m "Configure Supabase credentials"
git push
```

3. **Render will auto-deploy** (takes 1-2 minutes)

---

## Step 7: Test Your Admin Dashboard

1. **Go to:** https://weekendwarriorswc.onrender.com/admin.html
2. **Sign in** with the email and password you created in Step 4a
3. You should see the admin dashboard with sections for:
   - Homepage Slideshow
   - Background Audio
   - Practice Schedule
   - Upcoming Tournaments

---

## Step 8: Upload Your First Content

### Upload Slideshow Images/Videos:

1. In admin dashboard, go to **Homepage Slideshow** section
2. Click **"Choose File"** and select an image or video
3. Add a caption (optional)
4. Click **"Upload"**
5. Repeat for more slides
6. **Visit homepage** to see your slideshow!

### Upload Background Music:

1. In admin dashboard, go to **Background Audio** section
2. Click **"Choose File"** and select an MP3 file
3. Click **"Upload"**
4. **Visit homepage** - you'll see a mute/unmute button in bottom-right corner

### Add Practice Schedule:

1. Fill in Day, Time, and Group
2. Click **"Add"**
3. **Visit Schedule page** to see it live!

### Add Tournaments:

1. Select date, enter event name and location
2. Click **"Add"**
3. **Visit Schedule page** to see it live!

---

## Troubleshooting

### "Not an admin" error when trying to add content:
- Make sure you ran the SQL in Step 4b to add your email to the `admins` table
- Make sure the email matches EXACTLY (case-sensitive)

### "Failed to fetch" or connection errors:
- Double-check your SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Make sure you updated ALL THREE files (admin.html, index.html, schedule.html)

### Images/videos not uploading:
- Check file size (max 50MB)
- Make sure the `media` storage bucket was created (Step 3)
- Check browser console for errors (F12 → Console tab)

### Can't sign in:
- Make sure you checked "Auto Confirm User" when creating the user
- Try resetting password in Supabase dashboard (Authentication → Users → click user → Reset password)

---

## Security Notes

- ✅ Your anon key is safe to expose in client-side code
- ✅ Row Level Security (RLS) protects your data
- ✅ Only emails in the `admins` table can edit content
- ✅ Everyone can view content (public read)
- ⚠️ Never share your `service_role` key (not used in this project)

---

## Next Steps

Once everything is working:
1. Delete this guide file (`SUPABASE_SETUP_GUIDE.md`)
2. Delete the logo instructions file (`SAVE_LOGO_INSTRUCTIONS.md`)
3. Start adding your content!

**Need help?** Check the Supabase docs: https://supabase.com/docs

