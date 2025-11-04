# Wrestling Club CRM - Setup Guide

## 🎯 Overview

This is a complete wrestling club management system with:
- **Public Website** - Homepage, schedule, contact form, registration
- **Admin Dashboard** - Manage registrations, team roster, contact messages
- **Email Notifications** - Automatic alerts for new registrations and contact form submissions
- **GitHub Integration** - All data stored in GitHub (free, version-controlled)
- **Render Hosting** - Free hosting for the API backend

---

## 📋 What You'll Need

1. **GitHub Account** (free) - To store your data
2. **Render Account** (free) - To host the API backend
3. **SendGrid Account** (free) - To send email notifications
4. **Domain Name** (optional) - You can use free Render URLs or connect your own domain

---

## 🚀 Step 1: Set Up GitHub Repository

### 1.1 Create a New Repository
1. Go to [GitHub](https://github.com) and sign in
2. Click **"New Repository"**
3. Name it: `yourclub-website` (or any name you prefer)
4. Make it **Public** (required for free hosting)
5. Click **"Create Repository"**

### 1.2 Upload Files
1. Download all files from the `GENERIC_VERSION` folder
2. Upload them to your new GitHub repository
3. Make sure the folder structure looks like this:
   ```
   yourclub-website/
   ├── api/
   │   └── server.js
   ├── data/
   │   ├── schedule.json
   │   ├── winter-signups.json
   │   ├── contact-messages.json
   │   └── ...
   ├── index.html
   ├── admin.html
   ├── winter-signups.html
   └── ...
   ```

### 1.3 Create a Personal Access Token
1. Go to GitHub → **Settings** → **Developer Settings** → **Personal Access Tokens** → **Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Name it: `Wrestling Club API`
4. Select scopes:
   - ✅ `repo` (all repo permissions)
5. Click **"Generate token"**
6. **COPY THE TOKEN** - You won't see it again!

---

## 🔧 Step 2: Customize the Code

### 2.1 Replace Placeholder Values

Search and replace these values throughout ALL files:

| Find | Replace With |
|------|--------------|
| `yourclub.com` | Your actual domain (or leave as-is for now) |
| `YourGitHubUsername` | Your GitHub username |
| `yourrepo` | Your repository name |
| `Your Wrestling Club` | Your club's name |
| `contact@yourclub.com` | Email for contact form notifications |
| `registrations@yourclub.com` | Email for registration notifications |
| `noreply@yourclub.com` | Verified sender email (see SendGrid setup) |

### 2.2 Update Contact Information

Edit `contact.html` and replace:
```html
<strong>Name:</strong> Your Coach Name<br>
<strong>Phone:</strong> 555-123-4567<br>
<strong>Email:</strong> contact@yourclub.com
```

### 2.3 Update Club Logos

Replace these image files with your club's logos:
- `IMG_6531.png` - Main club logo
- `IMG_6549-Picsart-BackgroundRemover.jpeg` - Partner logo 1
- `IMG_6550-Picsart-BackgroundRemover.jpeg` - Partner logo 2

---

## 📧 Step 3: Set Up SendGrid (Email Notifications)

### 3.1 Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for a **free account** (100 emails/day)
3. Verify your email address

### 3.2 Verify Sender Email
1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Enter your email address (e.g., `coach@gmail.com`)
4. Check your email and click the verification link

### 3.3 Create API Key
1. Go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name it: `Wrestling Club Notifications`
4. Select **"Full Access"**
5. Click **"Create & View"**
6. **COPY THE API KEY** - You won't see it again!

---

## 🌐 Step 4: Deploy to Render

### 4.1 Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up with your GitHub account

### 4.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `yourclub-api`
   - **Root Directory**: `api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`

### 4.3 Add Environment Variables
Click **"Environment"** tab and add these variables:

| Key | Value |
|-----|-------|
| `GITHUB_TOKEN` | Your GitHub Personal Access Token |
| `REPO_OWNER` | Your GitHub username |
| `REPO_NAME` | Your repository name |
| `REPO_BRANCH` | `main` |
| `SENDGRID_API_KEY` | Your SendGrid API key |
| `CONTACT_NOTIFICATION_EMAIL` | Email to receive contact form notifications |
| `REGISTRATION_NOTIFICATION_EMAIL` | Email to receive registration notifications |
| `VERIFIED_SENDER_EMAIL` | Email you verified in SendGrid |

### 4.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Your API will be live at: `https://yourclub-api.onrender.com`

---

## 🌍 Step 5: Deploy Website (GitHub Pages)

### 5.1 Enable GitHub Pages
1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **"main"** branch
4. Click **"Save"**
5. Your website will be live at: `https://yourusername.github.io/yourrepo`

### 5.2 Update API URLs
In ALL HTML files, find and replace:
```javascript
const API_URL = 'https://api.weekendwarriorswc.com';
```
With:
```javascript
const API_URL = 'https://yourclub-api.onrender.com';
```

### 5.3 Update CORS in server.js
In `api/server.js`, update the CORS origins:
```javascript
origin: [
  'https://yourusername.github.io',
  'https://yourclub-api.onrender.com',
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8000'
],
```

---

## 🎨 Step 6: Customize Your Website

### 6.1 Update Homepage Content
Edit `index.html`:
- Change the welcome message
- Update club description
- Add your club's mission statement

### 6.2 Update About Page
Edit `about.html`:
- Add coach bios
- Add club history
- Add achievements

### 6.3 Update Schedule
Edit `data/schedule.json`:
```json
{
  "practices": [
    {
      "day": "Monday",
      "time": "6:00 PM - 7:30 PM",
      "location": "Your School Gym"
    }
  ]
}
```

### 6.4 Customize Colors
The default theme uses:
- **Primary Color**: `#4db8ff` (bright blue)
- **Background**: `#001a33` (dark blue)
- **Accent**: `#e60000` (red)

To change colors, edit `style.css` and search/replace color codes.

---

## 🔐 Step 7: Set Up Admin Access

### 7.1 Create Admin Password
1. Go to your website: `https://yourusername.github.io/yourrepo/admin.html`
2. The default password is in `data/admin-password.json`
3. Change it immediately after first login

### 7.2 Test Admin Features
- View registrations
- Manage team roster
- View contact messages
- Send bulk emails to team

---

## 📱 Step 8: Test Everything

### 8.1 Test Registration Form
1. Go to `winter-signups.html`
2. Fill out and submit a test registration
3. Check that:
   - Data appears in admin dashboard
   - You receive an email notification
   - Form shows success message

### 8.2 Test Contact Form
1. Go to `contact.html`
2. Submit a test message
3. Check that:
   - Message appears in admin dashboard
   - You receive an email notification

### 8.3 Test Admin Panel
1. Log in to admin dashboard
2. Try editing schedule
3. Try adding/removing team members
4. Try sending bulk email

---

## 🎯 Step 9: Connect Custom Domain (Optional)

### 9.1 For Render API
1. Go to Render dashboard → Your service → **Settings**
2. Click **"Add Custom Domain"**
3. Enter: `api.yourclub.com`
4. Add the CNAME record to your domain registrar

### 9.2 For GitHub Pages Website
1. Go to GitHub repository → **Settings** → **Pages**
2. Under **Custom domain**, enter: `www.yourclub.com`
3. Add DNS records at your domain registrar:
   - **CNAME**: `www` → `yourusername.github.io`

---

## 🆘 Troubleshooting

### Email Notifications Not Working
- ✅ Check SendGrid API key is correct
- ✅ Verify sender email in SendGrid
- ✅ Check Render environment variables
- ✅ Look at Render logs for errors

### Registration Form Not Saving
- ✅ Check GitHub token has `repo` permissions
- ✅ Verify repository name and owner are correct
- ✅ Check browser console for errors
- ✅ Look at Render logs

### Admin Panel Not Loading
- ✅ Check API URL is correct in HTML files
- ✅ Verify CORS settings in server.js
- ✅ Check browser console for errors

### Images Not Showing
- ✅ Verify image files are uploaded to GitHub
- ✅ Check file names match exactly (case-sensitive)
- ✅ Clear browser cache

---

## 💰 Pricing

This setup is **100% FREE** with these limits:
- **GitHub**: Unlimited public repositories
- **Render**: 750 hours/month (enough for 24/7 uptime)
- **SendGrid**: 100 emails/day
- **GitHub Pages**: Unlimited bandwidth

---

## 📞 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review Render logs for error messages
3. Check browser console (F12) for JavaScript errors
4. Contact: support@syndiscore.ai

---

## 🎉 You're Done!

Your wrestling club CRM is now live! Share the website URL with parents and start managing your team.

**Next Steps:**
- Add your club's schedule
- Upload team photos
- Customize the waiver text
- Set up social media links
- Add tournament results

---

**Powered by SyndiScore.ai** 🚀

