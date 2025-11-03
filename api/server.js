const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 3000;

// SendGrid configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const NOTIFICATION_EMAILS = process.env.NOTIFICATION_EMAILS || 'WeekendWarriorsWC@yahoo.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('SendGrid configured for email notifications');
  console.log('Notification emails will be sent to:', NOTIFICATION_EMAILS);
} else {
  console.warn('⚠️  SENDGRID_API_KEY not set - email notifications disabled');
}

// CORS Configuration - Allow requests from your website
const corsOptions = {
  origin: [
    'https://www.weekendwarriorswc.com',
    'https://weekendwarriorswc.com',
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'Syndiscore2025';
const REPO_NAME = process.env.REPO_NAME || 'weekendwarriorswc';
const REPO_BRANCH = process.env.REPO_BRANCH || 'main';

console.log('GitHub Config:', {
  hasToken: !!GITHUB_TOKEN,
  tokenPrefix: GITHUB_TOKEN ? GITHUB_TOKEN.substring(0, 4) + '...' : 'MISSING',
  owner: REPO_OWNER,
  repo: REPO_NAME,
  branch: REPO_BRANCH
});

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Helper function to update a file in GitHub
async function updateGitHubFile(path, content, message) {
  try {
    console.log(`Updating GitHub file: ${path}`);

    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is not set');
    }

    // Get current file SHA
    let sha;
    try {
      console.log(`Getting current SHA for: ${path}`);
      const { data } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path,
        ref: REPO_BRANCH,
      });
      sha = data.sha;
      console.log(`Found existing file with SHA: ${sha}`);
    } catch (err) {
      // File doesn't exist yet
      console.log(`File doesn't exist yet: ${path}`, err.status, err.message);
      sha = null;
    }

    // Update or create file
    console.log(`Creating/updating file: ${path}`);
    const result = await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch: REPO_BRANCH,
    });

    console.log(`Successfully updated: ${path}`);
    return { success: true };
  } catch (error) {
    console.error('GitHub API Error:', error.message);
    console.error('Error details:', {
      status: error.status,
      message: error.message,
      path,
      owner: REPO_OWNER,
      repo: REPO_NAME,
      branch: REPO_BRANCH,
    });
    throw error;
  }
}

// Helper function to send email notifications
async function sendEmailNotification(subject, htmlContent, textContent) {
  if (!SENDGRID_API_KEY) {
    console.log('Email notification skipped (SendGrid not configured)');
    return { success: false, reason: 'SendGrid not configured' };
  }

  try {
    const emails = NOTIFICATION_EMAILS.split(',').map(e => e.trim());

    const msg = {
      to: emails,
      from: 'michael.horak01@gmail.com', // Must be verified in SendGrid
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`✅ Email notification sent to: ${emails.join(', ')}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email notification failed:', error.message);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return { success: false, error: error.message };
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test GitHub connection
app.get('/test-github', async (req, res) => {
  try {
    console.log('Testing GitHub connection...');

    // Test 1: Check if we can access the repo
    const repoInfo = await octokit.repos.get({
      owner: REPO_OWNER,
      repo: REPO_NAME,
    });

    console.log('Repo access: OK', repoInfo.data.name);

    // Test 2: Check if we can read a file
    const fileInfo = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'data/schedule.json',
      ref: REPO_BRANCH,
    });

    console.log('File read: OK', fileInfo.data.name);

    res.json({
      success: true,
      config: {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        branch: REPO_BRANCH,
        hasToken: !!GITHUB_TOKEN,
      },
      tests: {
        repoAccess: 'OK',
        fileRead: 'OK',
      }
    });
  } catch (error) {
    console.error('GitHub test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      status: error.status,
      config: {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        branch: REPO_BRANCH,
        hasToken: !!GITHUB_TOKEN,
      }
    });
  }
});

// Update schedule
app.post('/api/schedule', async (req, res) => {
  try {
    const scheduleData = req.body;
    const content = JSON.stringify(scheduleData, null, 2);
    
    await updateGitHubFile(
      'data/schedule.json',
      content,
      'Update practice schedule via admin panel'
    );

    res.json({ success: true, message: 'Schedule updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update slides
app.post('/api/slides', async (req, res) => {
  try {
    const slidesData = req.body;
    const content = JSON.stringify(slidesData, null, 2);
    
    await updateGitHubFile(
      'data/slides.json',
      content,
      'Update slides via admin panel'
    );

    res.json({ success: true, message: 'Slides updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update audio
app.post('/api/audio', async (req, res) => {
  try {
    const audioData = req.body;
    const content = JSON.stringify(audioData, null, 2);
    
    await updateGitHubFile(
      'data/audio.json',
      content,
      'Update audio via admin panel'
    );

    res.json({ success: true, message: 'Audio updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload media file (for slides/audio files)
app.post('/api/upload-media', async (req, res) => {
  try {
    const { fileName, fileContent, fileType } = req.body;

    // fileContent should be base64 encoded
    await updateGitHubFile(
      `media/${fileName}`,
      Buffer.from(fileContent, 'base64'),
      `Upload ${fileType} file: ${fileName}`
    );

    res.json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generic save endpoint (used by admin panel)
app.post('/save', async (req, res) => {
  try {
    console.log('Save request received:', { file: req.body.file });
    const { file, content } = req.body;

    if (!file || content === undefined) {
      console.error('Missing file or content:', { file, hasContent: content !== undefined });
      return res.status(400).json({ success: false, error: 'Missing file or content' });
    }

    console.log('Updating GitHub file:', file);
    await updateGitHubFile(
      file,
      content,
      `Update ${file} via admin panel`
    );

    // Send email notifications for new submissions
    if (file === 'data/contact-messages.json') {
      try {
        const messages = JSON.parse(content);
        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];

          const subject = '📧 New Contact Form Submission - Weekend Warriors WC';
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4db8ff; border-bottom: 3px solid #4db8ff; padding-bottom: 10px;">
                New Contact Form Submission
              </h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${latestMessage.name}</p>
                <p><strong>Email:</strong> <a href="mailto:${latestMessage.email}">${latestMessage.email}</a></p>
                <p><strong>Submitted:</strong> ${new Date(latestMessage.submitted_at).toLocaleString()}</p>
              </div>
              <div style="background: #fff; padding: 20px; border-left: 4px solid #4db8ff; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Message:</h3>
                <p style="white-space: pre-wrap; color: #555;">${latestMessage.message}</p>
              </div>
              <p style="color: #888; font-size: 0.9em; margin-top: 30px;">
                View all messages in the <a href="https://www.weekendwarriorswc.com/admin.html">admin dashboard</a>
              </p>
            </div>
          `;
          const textContent = `
New Contact Form Submission

Name: ${latestMessage.name}
Email: ${latestMessage.email}
Submitted: ${new Date(latestMessage.submitted_at).toLocaleString()}

Message:
${latestMessage.message}

View all messages in the admin dashboard: https://www.weekendwarriorswc.com/admin.html
          `;

          await sendEmailNotification(subject, htmlContent, textContent);
        }
      } catch (emailError) {
        console.error('Error sending contact notification email:', emailError);
        // Don't fail the save if email fails
      }
    }

    if (file === 'data/winter-signups.json') {
      try {
        const signups = JSON.parse(content);
        if (signups.length > 0) {
          const latestSignup = signups[signups.length - 1];

          const subject = '🤼 New Wrestler Registration - Weekend Warriors WC';
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4db8ff; border-bottom: 3px solid #4db8ff; padding-bottom: 10px;">
                New Wrestler Registration
              </h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Wrestler Information</h3>
                <p><strong>Name:</strong> ${latestSignup.wrestler_name}</p>
                <p><strong>Date of Birth:</strong> ${latestSignup.wrestler_dob}</p>
                <p><strong>Grade:</strong> ${latestSignup.wrestler_grade}</p>
                <p><strong>Weight:</strong> ${latestSignup.wrestler_weight} lbs</p>
              </div>
              <div style="background: #fff; padding: 20px; border-left: 4px solid #4db8ff; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Parent/Guardian Information</h3>
                <p><strong>Name:</strong> ${latestSignup.parent_name}</p>
                <p><strong>Email:</strong> <a href="mailto:${latestSignup.email}">${latestSignup.email}</a></p>
                <p><strong>Phone:</strong> ${latestSignup.phone}</p>
                <p><strong>Address:</strong> ${latestSignup.address}</p>
                <p><strong>Town:</strong> ${latestSignup.town}</p>
              </div>
              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #2e7d32;">
                  <strong>✓ Waiver Acknowledged:</strong> ${new Date(latestSignup.waiver_acknowledged_at).toLocaleString()}
                </p>
                <p style="margin: 10px 0 0 0; color: #555; font-size: 0.9em;">
                  <strong>Submitted:</strong> ${new Date(latestSignup.submitted_at).toLocaleString()}
                </p>
              </div>
              <p style="color: #888; font-size: 0.9em; margin-top: 30px;">
                View all registrations in the <a href="https://www.weekendwarriorswc.com/admin.html">admin dashboard</a>
              </p>
            </div>
          `;
          const textContent = `
New Wrestler Registration

WRESTLER INFORMATION
Name: ${latestSignup.wrestler_name}
Date of Birth: ${latestSignup.wrestler_dob}
Grade: ${latestSignup.wrestler_grade}
Weight: ${latestSignup.wrestler_weight} lbs

PARENT/GUARDIAN INFORMATION
Name: ${latestSignup.parent_name}
Email: ${latestSignup.email}
Phone: ${latestSignup.phone}
Address: ${latestSignup.address}
Town: ${latestSignup.town}

Waiver Acknowledged: ${new Date(latestSignup.waiver_acknowledged_at).toLocaleString()}
Submitted: ${new Date(latestSignup.submitted_at).toLocaleString()}

View all registrations in the admin dashboard: https://www.weekendwarriorswc.com/admin.html
          `;

          await sendEmailNotification(subject, htmlContent, textContent);
        }
      } catch (emailError) {
        console.error('Error sending registration notification email:', emailError);
        // Don't fail the save if email fails
      }
    }

    console.log('File saved successfully:', file);
    res.json({ success: true, message: 'File saved successfully' });
  } catch (error) {
    console.error('Save error:', error.message, error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generic upload endpoint (used by admin panel)
app.post('/upload', async (req, res) => {
  try {
    const { path, content } = req.body;

    if (!path || !content) {
      return res.status(400).json({ success: false, error: 'Missing path or content' });
    }

    // content is base64 encoded
    await updateGitHubFile(
      path,
      Buffer.from(content, 'base64'),
      `Upload file: ${path}`
    );

    res.json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

