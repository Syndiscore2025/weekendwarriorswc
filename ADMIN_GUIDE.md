# Admin Dashboard Guide

## 🎉 No More Supabase!

Your site now uses **simple JSON files** instead of Supabase. Everything is stored in the `data/` folder.

---

## 🔐 How to Access the Admin Dashboard

1. Open: **admin-simple.html** in your browser
2. Password: **warriors2025**
3. Click "Sign In"

---

## 📝 How to Use the Dashboard

### Upload Slides (Images/Videos)
1. Click "Choose File" and select an image or video
2. Add a caption (optional)
3. Click "Upload Slide"
4. **Follow the instructions shown:**
   - Copy the selected file to the `media/` folder
   - Copy the JSON shown and paste it into `data/slides.json`
   - Commit and push to GitHub

### Upload Background Audio
1. Click "Choose File" and select an MP3
2. Click "Upload Audio"
3. **Follow the instructions shown:**
   - Copy the file to the `media/` folder with the new name shown
   - Copy the JSON shown and paste it into `data/audio.json`
   - Commit and push to GitHub

### Add Schedule Entry
1. Fill in Day, Time, and Group
2. Click "Add Schedule"
3. **Copy the JSON shown and paste it into `data/schedule.json`**
4. Commit and push to GitHub

### Add Tournament
1. Fill in Date, Event Name, Location, and Registration URL (optional)
2. Click "Add Tournament"
3. **Copy the JSON shown and paste it into `data/tournaments.json`**
4. Commit and push to GitHub

### View Winter Sign-Ups
- Click "Refresh" to see all submissions
- These are stored in `data/winter-signups.json`
- When someone submits the winter signup form, they'll get a popup with the JSON to send you
- You manually add it to `data/winter-signups.json`

---

## 📁 File Structure

```
weekendwarriorswc/
├── data/
│   ├── admin-password.json    ← Admin password (change this!)
│   ├── slides.json            ← Homepage slideshow
│   ├── audio.json             ← Background audio
│   ├── schedule.json          ← Practice schedule
│   ├── tournaments.json       ← Upcoming tournaments
│   └── winter-signups.json    ← Winter signup submissions
├── media/
│   └── (your uploaded images, videos, audio files)
├── admin-simple.html          ← NEW ADMIN DASHBOARD (use this!)
├── index.html                 ← Homepage
├── schedule.html              ← Schedule page
└── winter-signups.html        ← Winter signup form
```

---

## 🔒 Change Admin Password

1. Open `data/admin-password.json`
2. Change `"warriors2025"` to your new password
3. Save and push to GitHub

---

## ✅ How It Works

1. **No database needed** - Everything is stored in JSON files
2. **No authentication backend** - Password is checked client-side (simple but works)
3. **Manual file management** - You copy files to `media/` and update JSON files
4. **GitHub is your "database"** - Commit and push to update the live site

---

## 🚀 Quick Workflow Example

**Adding a new slide:**
1. Open admin-simple.html
2. Sign in with password
3. Upload a slide
4. Copy the file to `media/` folder
5. Copy the JSON to `data/slides.json`
6. Run: `git add .; git commit -m "Add new slide"; git push origin main`
7. Done! The homepage will show the new slide

---

## 🆘 Troubleshooting

**Dashboard won't load?**
- Make sure you're opening `admin-simple.html` (not `admin.html`)
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**Can't sign in?**
- Check `data/admin-password.json` for the correct password
- Default is: `warriors2025`

**Changes not showing on live site?**
- Make sure you committed and pushed to GitHub
- Wait 1-2 minutes for GitHub Pages to rebuild
- Hard refresh the page

---

## 📱 Team Chat App (Future)

You asked about building a team chat app for iOS/Android. Here's the plan:

**Option 1: React Native**
- One codebase for both iOS and Android
- Use Firebase for real-time chat
- Can build and deploy yourself

**Option 2: Flutter**
- One codebase for both iOS and Android
- Use Firebase or Supabase for backend
- Faster performance than React Native

**Option 3: Simple Web App**
- Build a mobile-friendly web chat
- No app store needed
- Works on any device with a browser

Let me know when you want to start on this!

