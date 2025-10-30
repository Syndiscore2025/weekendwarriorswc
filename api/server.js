const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'Syndiscore2025';
const REPO_NAME = process.env.REPO_NAME || 'weekendwarriorswc';
const REPO_BRANCH = process.env.REPO_BRANCH || 'main';

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
      console.log(`File doesn't exist yet: ${path}`);
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
    });
    throw error;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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

