# Configuration Checklist

Use this checklist to ensure you've customized all the necessary files for your wrestling club.

---

## ✅ Step 1: GitHub Setup

- [ ] Created GitHub repository
- [ ] Uploaded all files
- [ ] Created Personal Access Token
- [ ] Saved token securely

**Repository Details:**
- Repository Name: `_________________`
- GitHub Username: `_________________`
- Personal Access Token: `_________________` (keep secret!)

---

## ✅ Step 2: SendGrid Setup

- [ ] Created SendGrid account
- [ ] Verified sender email
- [ ] Created API key
- [ ] Saved API key securely

**SendGrid Details:**
- Verified Sender Email: `_________________`
- SendGrid API Key: `_________________` (keep secret!)
- Contact Notification Email: `_________________`
- Registration Notification Email: `_________________`

---

## ✅ Step 3: Code Customization

### Files to Update:

#### api/server.js
- [ ] Line 11: `CONTACT_NOTIFICATION_EMAIL` default value
- [ ] Line 12: `REGISTRATION_NOTIFICATION_EMAIL` default value
- [ ] Line 13: `VERIFIED_SENDER_EMAIL` default value
- [ ] Lines 26-28: CORS origins (your domain)
- [ ] Line 44: `REPO_OWNER` default value
- [ ] Line 45: `REPO_NAME` default value

#### All HTML Files (index.html, admin.html, contact.html, etc.)
- [ ] Replace `API_URL` with your Render URL
- [ ] Replace club name "Weekend Warriors Wrestling Club" with your club name
- [ ] Update footer copyright year and club name

#### contact.html
- [ ] Line 76: Coach/Contact name
- [ ] Line 77: Phone number
- [ ] Line 78: Contact email
- [ ] Line 183: Fallback contact email in error message

#### admin.html
- [ ] Line 736: Update note about sending email address
- [ ] Line 1967: Update email signature in bulk email template

#### winter-signups.html
- [ ] Update club name throughout
- [ ] Update partnership information (if applicable)
- [ ] Update waiver text with your club's legal information
- [ ] Update program pricing and schedule

---

## ✅ Step 4: Render Deployment

- [ ] Created Render account
- [ ] Created Web Service
- [ ] Connected GitHub repository
- [ ] Set root directory to `api`
- [ ] Set build command to `npm install`
- [ ] Set start command to `node server.js`

**Environment Variables Added:**
- [ ] `GITHUB_TOKEN`
- [ ] `REPO_OWNER`
- [ ] `REPO_NAME`
- [ ] `REPO_BRANCH` (set to `main`)
- [ ] `SENDGRID_API_KEY`
- [ ] `CONTACT_NOTIFICATION_EMAIL`
- [ ] `REGISTRATION_NOTIFICATION_EMAIL`
- [ ] `VERIFIED_SENDER_EMAIL`

**Render Details:**
- Service Name: `_________________`
- Service URL: `_________________`

---

## ✅ Step 5: GitHub Pages

- [ ] Enabled GitHub Pages
- [ ] Set source to `main` branch
- [ ] Verified website is live

**Website URL:** `_________________`

---

## ✅ Step 6: Visual Customization

- [ ] Uploaded club logo (replace `IMG_6531.png`)
- [ ] Uploaded partner logos (if applicable)
- [ ] Updated color scheme in `style.css`
- [ ] Updated homepage slideshow images
- [ ] Added background music (optional)

---

## ✅ Step 7: Content Updates

### data/schedule.json
- [ ] Updated practice days and times
- [ ] Updated practice location
- [ ] Updated coach information

### data/tournaments.json
- [ ] Added upcoming tournaments
- [ ] Updated tournament dates and locations

### About Page
- [ ] Added coach bios
- [ ] Added club history
- [ ] Added achievements/awards

### Homepage
- [ ] Updated welcome message
- [ ] Updated club description
- [ ] Added mission statement

---

## ✅ Step 8: Testing

- [ ] Tested registration form submission
- [ ] Verified registration email notification received
- [ ] Tested contact form submission
- [ ] Verified contact email notification received
- [ ] Logged into admin panel
- [ ] Verified registrations appear in admin
- [ ] Tested team roster management
- [ ] Tested bulk email feature
- [ ] Tested on mobile device
- [ ] Tested on desktop browser

---

## ✅ Step 9: Security

- [ ] Changed admin password from default
- [ ] Verified GitHub token has correct permissions
- [ ] Confirmed SendGrid API key is not exposed in code
- [ ] Tested that only admins can access admin panel

---

## ✅ Step 10: Custom Domain (Optional)

- [ ] Purchased domain name
- [ ] Added custom domain to Render
- [ ] Added CNAME record for API subdomain
- [ ] Added custom domain to GitHub Pages
- [ ] Added CNAME record for website
- [ ] Updated CORS settings in server.js
- [ ] Updated API_URL in all HTML files
- [ ] Verified SSL certificate is active

**Domain Details:**
- Domain Name: `_________________`
- Website URL: `_________________`
- API URL: `_________________`

---

## 📝 Search & Replace Summary

Use your code editor's "Find and Replace in Files" feature:

| Find This | Replace With Your Value |
|-----------|-------------------------|
| `yourclub.com` | Your domain name |
| `YourGitHubUsername` | Your GitHub username |
| `yourrepo` | Your repository name |
| `Your Wrestling Club` | Your club's full name |
| `contact@yourclub.com` | Your contact email |
| `registrations@yourclub.com` | Your registration email |
| `noreply@yourclub.com` | Your verified sender email |
| `https://api.weekendwarriorswc.com` | Your Render API URL |
| `Weekend Warriors Wrestling Club` | Your club name |
| `WeekendWarriorsWC@yahoo.com` | Your contact email |
| `860-336-8969` | Your phone number |
| `Tony Decato` | Your coach/contact name |

---

## 🎯 Final Checklist

- [ ] All placeholder text replaced
- [ ] All email addresses updated
- [ ] All URLs updated
- [ ] All images uploaded
- [ ] All forms tested
- [ ] All email notifications working
- [ ] Admin panel accessible
- [ ] Mobile responsive design verified
- [ ] SSL certificate active (https://)
- [ ] Domain connected (if applicable)

---

## 📞 Launch Day Tasks

- [ ] Announce website to parents via email
- [ ] Post website link on social media
- [ ] Add website to club business cards
- [ ] Add website to gym signage
- [ ] Send test registration to verify everything works
- [ ] Monitor admin panel for first real submissions

---

## 🔄 Ongoing Maintenance

### Weekly:
- [ ] Check for new registrations
- [ ] Respond to contact form messages
- [ ] Update schedule if practices change

### Monthly:
- [ ] Update tournament schedule
- [ ] Add new team photos
- [ ] Review and update roster

### Seasonally:
- [ ] Archive previous season data
- [ ] Update pricing for new season
- [ ] Update waiver if needed
- [ ] Refresh homepage content

---

**Configuration Complete!** ✅

Your wrestling club CRM is ready to launch. Keep this checklist for reference and future updates.

---

**Need Help?**
- Email: support@syndiscore.ai
- Documentation: See SETUP_GUIDE.md
- Troubleshooting: See SETUP_GUIDE.md Section 9

---

**Powered by SyndiScore.ai** 🚀

