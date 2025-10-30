const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'rakinplaban';
const REPO_NAME = process.env.REPO_NAME || 'weekendwarriorswc';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Helper function to update a file in GitHub
async function updateGitHubFile(path, content, message) {
  try {
    // Get current file SHA
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path,
      });
      sha = data.sha;
    } catch (err) {
      // File doesn't exist yet
      sha = null;
    }

    // Update or create file
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    });

    return { success: true };
  } catch (error) {
    console.error('GitHub API Error:', error);
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
      Buffer.from(fileContent, 'base64').toString(),
      `Upload ${fileType} file: ${fileName}`
    );

    res.json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

