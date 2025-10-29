# ❄️ Winter 2025 Sign Ups - Setup Guide

## Overview
The Winter 2025 Sign Ups page is a partnership between **Weekend Warriors Wrestling Club** and **Wethersfield Youth Wrestling Club**. It features:

- ❄️ **Ice-themed design** with animated snowflakes
- 🎨 **Cool logo animation** showing both clubs merging into the Eagle Warrior combined logo
- 📝 **Sign-up form** for wrestlers (grades 4-8)
- 🔒 **Secure data storage** in Supabase with admin-only access to view registrations

---

## 🚀 Quick Setup

### Step 1: Run the Database Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `winter_signups_migration.sql`
4. Click **Run**

This will create the `winter_signups_2025` table with proper security policies.

---

## 📋 What the Form Collects

The sign-up form collects the following information:

1. **Parent/Guardian Name** (required)
2. **Wrestler Name** (required)
3. **Wrestler Date of Birth** (required, date picker)
4. **Wrestler Grade** (required, dropdown: 4th-8th grade)
5. **Phone Number** (required)
6. **Email Address** (required)
7. **Submission Timestamp** (automatic)

---

## 🎨 Features

### Ice Theme
- Blue gradient background (#001a33 to #003d5c)
- Animated falling snowflakes (50 snowflakes with random speeds and positions)
- Ice crystal overlay effects
- Blue accent color (#4db8ff) instead of red

### Logo Animation
The page features a stunning 3-step logo animation:

1. **Weekend Warriors logo** slides in from the left with rotation
2. **Wethersfield Wrestling logo** slides in from the right with rotation
3. Both logos **collide in the center**
4. **Eagle Warrior combined logo** explodes into view with glow effects

The animation plays automatically when the page loads.

### Form Features
- Clean, modern design with ice-themed styling
- Date picker for wrestler's date of birth
- Dropdown for grade selection (4th-8th)
- Real-time form validation
- Success message after submission
- Auto-reset form after successful submission

---

## 🔐 Security & Privacy

### Row Level Security (RLS) Policies

The `winter_signups_2025` table has three security policies:

1. **Public Insert** - Anyone can submit a sign-up (no login required)
   ```sql
   create policy "public insert winter signups" 
   on winter_signups_2025 for insert with check (true);
   ```

2. **Admin Read** - Only admins can view registrations
   ```sql
   create policy "admins read winter signups" 
   on winter_signups_2025 for select using (
     exists(select 1 from admins a where a.email = auth.email())
   );
   ```

3. **Admin Delete** - Only admins can delete registrations
   ```sql
   create policy "admins delete winter signups" 
   on winter_signups_2025 for delete using (
     exists(select 1 from admins a where a.email = auth.email())
   );
   ```

This means:
- ✅ Parents can sign up their wrestlers without creating an account
- ✅ Only authorized admins can see the registrations
- ✅ Only authorized admins can delete registrations
- ❌ Public users cannot view other people's registrations

---

## 📊 Admin Dashboard

### Viewing Registrations

Admins can view all Winter 2025 sign-ups in the admin dashboard:

1. Go to **admin.html**
2. Sign in with your admin credentials
3. Scroll to the **"❄️ Winter 2025 Sign Ups"** section
4. You'll see a table with all registrations including:
   - Parent Name
   - Wrestler Name
   - Date of Birth
   - Grade
   - Phone Number
   - Email Address
   - Submission Date & Time
   - Delete button

### Logo Display in Admin

The admin dashboard shows all three logos:
- Weekend Warriors logo
- × (multiplication symbol)
- Wethersfield Wrestling logo
- = (equals symbol)
- Eagle Warrior combined logo

This visually represents the partnership.

---

## 🎯 Navigation

The **Winter Sign Ups** link has been added to the navigation menu on all pages:
- index.html (Home)
- about.html
- schedule.html
- contact.html
- admin.html

Users can access the sign-up page from any page on the site.

---

## 📁 Files Created/Modified

### New Files:
1. **winter-signups.html** - The main sign-up page with ice theme and logo animation
2. **winter_signups_migration.sql** - Database migration script
3. **WINTER_SIGNUPS_README.md** - This file

### Modified Files:
1. **admin.html** - Added Winter Sign Ups section with logo display and registration table
2. **index.html** - Added Winter Sign Ups link to navigation
3. **about.html** - Added Winter Sign Ups link to navigation
4. **schedule.html** - Added Winter Sign Ups link to navigation
5. **contact.html** - Added Winter Sign Ups link to navigation
6. **SUPABASE_SETUP_GUIDE.md** - Added winter_signups_2025 table schema and policies

---

## 🎨 Customization

### Changing Colors
The ice theme uses these main colors:
- **Background**: `#001a33` to `#003d5c` (dark blue gradient)
- **Accent**: `#4db8ff` (bright blue)
- **Text**: `#b3e0ff` (light blue)

To change colors, edit the CSS in `winter-signups.html`.

### Adjusting Snowflakes
To change the number of snowflakes, edit this line in the JavaScript:
```javascript
for (let i = 0; i < 50; i++) {  // Change 50 to your desired number
```

### Logo Animation Timing
To adjust animation timing, edit these CSS animations:
- `slideInLeft` - Controls left logo animation (2s duration)
- `slideInRight` - Controls right logo animation (2s duration)
- `explodeIn` - Controls combined logo explosion (1s duration, 2.5s delay)

---

## 🐛 Troubleshooting

### Form Submissions Not Saving
1. Check that you ran the migration SQL in Supabase
2. Verify the table exists: Go to Supabase → Table Editor → Look for `winter_signups_2025`
3. Check browser console for errors (F12)

### Can't See Registrations in Admin
1. Make sure you're signed in as an admin
2. Verify your email is in the `admins` table
3. Check browser console for errors

### Logo Images Not Showing
1. Verify the logo files exist in the root directory:
   - `IMG_6531.png` (Weekend Warriors)
   - `IMG_6549-Picsart-BackgroundRemover.jpeg` (Wethersfield)
   - `IMG_6550-Picsart-BackgroundRemover.jpeg` (Eagle Warrior)
2. Check file names match exactly (case-sensitive)

---

## 📧 Data Export

To export registrations to CSV:

1. Go to Supabase → Table Editor → `winter_signups_2025`
2. Click the **Export** button
3. Choose CSV format
4. Download the file

Or run this SQL query:
```sql
SELECT 
  parent_name,
  wrestler_name,
  wrestler_dob,
  wrestler_grade,
  phone,
  email,
  submitted_at
FROM winter_signups_2025
ORDER BY submitted_at DESC;
```

---

## 🎉 Success!

Your Winter 2025 Sign Ups page is now live! Parents can register their wrestlers for the partnership program between Weekend Warriors and Wethersfield Youth Wrestling Club.

**Page URL**: `winter-signups.html`

---

## 📞 Support

If you encounter any issues:
1. Check the browser console (F12) for error messages
2. Verify all SQL migrations have been run
3. Ensure logo files are in the correct location
4. Check that Supabase credentials are correct in the HTML file

---

**Built with ❄️ by syndiscore.ai**

