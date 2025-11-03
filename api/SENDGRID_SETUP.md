# SendGrid Email Notification Setup Guide

This guide will help you set up SendGrid to receive email notifications when:
1. Someone submits a contact form
2. A new wrestler registers for the winter season

---

## Step 1: Create a SendGrid Account

1. Go to [https://sendgrid.com/](https://sendgrid.com/)
2. Click **"Start for Free"** or **"Sign Up"**
3. Create your account (free tier includes 100 emails/day - plenty for your needs)
4. Verify your email address

---

## Step 2: Verify Your Sender Email Address

SendGrid requires you to verify the email address you'll send FROM.

### Option A: Single Sender Verification (Easiest - Recommended)

1. Log in to SendGrid dashboard
2. Go to **Settings** → **Sender Authentication**
3. Click **"Verify a Single Sender"**
4. Fill in the form:
   - **From Name**: Weekend Warriors Wrestling Club
   - **From Email Address**: `notifications@weekendwarriorswc.com` (or use `WeekendWarriorsWC@yahoo.com`)
   - **Reply To**: `WeekendWarriorsWC@yahoo.com`
   - **Company Address**: Your club address
5. Click **"Create"**
6. Check your email and click the verification link

**Note**: If you use `WeekendWarriorsWC@yahoo.com`, you'll need to verify it through your Yahoo inbox.

### Option B: Domain Authentication (Advanced)

If you want to use `@weekendwarriorswc.com` email addresses, you'll need to authenticate your domain by adding DNS records. This is more complex but looks more professional.

---

## Step 3: Create an API Key

1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Give it a name: `Weekend Warriors Notifications`
4. Choose **"Restricted Access"**
5. Under **Mail Send**, toggle it to **"Full Access"**
6. Click **"Create & View"**
7. **COPY THE API KEY** - you'll only see it once!
   - It will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 4: Add Environment Variables to Render

1. Log in to your Render dashboard
2. Find your **API service** (the backend that runs on `api.weekendwarriorswc.com`)
3. Go to **Environment** tab
4. Add these environment variables:

   **Variable 1:**
   - **Key**: `SENDGRID_API_KEY`
   - **Value**: Paste the API key you copied (starts with `SG.`)

   **Variable 2:**
   - **Key**: `NOTIFICATION_EMAILS`
   - **Value**: `WeekendWarriorsWC@yahoo.com` (or add multiple emails separated by commas: `email1@example.com,email2@example.com`)

5. Click **"Save Changes"**
6. Render will automatically redeploy your API with the new environment variables

---

## Step 5: Update the "From" Email Address (if needed)

If you verified a different email address in Step 2, you need to update the code:

1. Open `api/server.js`
2. Find this line (around line 120):
   ```javascript
   from: 'notifications@weekendwarriorswc.com', // Must be verified in SendGrid
   ```
3. Change it to match your verified sender email:
   ```javascript
   from: 'WeekendWarriorsWC@yahoo.com', // Must be verified in SendGrid
   ```
4. Save and push to Git

---

## Step 6: Test the Email Notifications

### Test Contact Form:
1. Go to your website: [https://www.weekendwarriorswc.com/contact.html](https://www.weekendwarriorswc.com/contact.html)
2. Fill out and submit the contact form
3. Check your email inbox (the one you set in `NOTIFICATION_EMAILS`)
4. You should receive an email with the subject: **"📧 New Contact Form Submission - Weekend Warriors WC"**

### Test Registration Form:
1. Go to: [https://www.weekendwarriorswc.com/winter-signups.html](https://www.weekendwarriorswc.com/winter-signups.html)
2. Fill out and submit a test registration
3. Check your email inbox
4. You should receive an email with the subject: **"🤼 New Wrestler Registration - Weekend Warriors WC"**

---

## Troubleshooting

### No emails arriving?

1. **Check Render logs**:
   - Go to Render dashboard → Your API service → Logs
   - Look for messages like:
     - `✅ Email notification sent to: ...` (success)
     - `❌ Email notification failed: ...` (error)

2. **Check SendGrid Activity**:
   - Go to SendGrid dashboard → Activity
   - See if emails were sent and their delivery status

3. **Check spam folder**:
   - SendGrid emails might go to spam initially
   - Mark them as "Not Spam" to train your email provider

4. **Verify API key is set**:
   - In Render, check that `SENDGRID_API_KEY` environment variable is set correctly
   - Make sure there are no extra spaces

5. **Verify sender email**:
   - Make sure the email in `from:` field matches what you verified in SendGrid

### Common Errors:

**"The from email does not match a verified Sender Identity"**
- Solution: Update the `from:` email in `server.js` to match your verified sender

**"API key not set"**
- Solution: Add `SENDGRID_API_KEY` environment variable in Render

**"Invalid API key"**
- Solution: Regenerate API key in SendGrid and update in Render

---

## Email Notification Details

### What information is included?

**Contact Form Notifications:**
- Sender's name
- Sender's email address
- Message content
- Submission timestamp
- Link to admin dashboard

**Registration Notifications:**
- Wrestler's name, DOB, grade, weight
- Parent/guardian name, email, phone
- Address and town
- Waiver acknowledgment timestamp
- Submission timestamp
- Link to admin dashboard

### Who receives the emails?

The email addresses listed in the `NOTIFICATION_EMAILS` environment variable.

You can add multiple recipients by separating emails with commas:
```
email1@example.com,email2@example.com,email3@example.com
```

---

## Cost

SendGrid's **free tier** includes:
- ✅ 100 emails per day
- ✅ Perfect for your use case (you won't hit this limit)
- ✅ No credit card required

If you ever need more, paid plans start at $19.95/month for 50,000 emails.

---

## Support

If you need help:
1. Check Render logs for error messages
2. Check SendGrid Activity dashboard
3. Review this guide again
4. Contact SendGrid support (they have great documentation)

---

**That's it! You're all set up for email notifications! 🎉**

