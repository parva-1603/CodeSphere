const { Octokit } = require('@octokit/rest');
const User = require('../models/User');

const getRepos = async (req, res) => {
  try {
    const user = await User.findById(req.user.uid);
    if (!user || !user.githubAccessToken) {
      return res.status(400).json({ error: 'GitHub not connected. Please connect in Settings.' });
    }
    
    const octokit = new Octokit({ auth: user.githubAccessToken });
    const repos = await octokit.rest.repos.listForAuthenticatedUser({ sort: 'updated' });
    
    res.json(repos.data.map(r => ({ id: r.id, name: r.full_name, default_branch: r.default_branch })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const pullFile = async (req, res) => {
  try {
    const { owner, repo, path, ref } = req.body;
    const user = await User.findById(req.user.uid);
    if (!user || !user.githubAccessToken) return res.status(400).json({ error: 'GitHub not connected' });
    
    const octokit = new Octokit({ auth: user.githubAccessToken });
    const response = await octokit.rest.repos.getContent({
      owner, repo, path, ref
    });
    
    if (Array.isArray(response.data)) {
      return res.status(400).json({ error: 'Path is a directory, not a file' });
    }
    
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    res.json({ content, sha: response.data.sha });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const pushCommit = async (req, res) => {
  try {
    const { owner, repo, path, message, content, branch } = req.body;
    const user = await User.findById(req.user.uid);
    if (!user || !user.githubAccessToken) return res.status(400).json({ error: 'GitHub not connected' });
    
    const octokit = new Octokit({ auth: user.githubAccessToken });
    
    let sha;
    try {
      const fileRes = await octokit.rest.repos.getContent({ owner, repo, path, ref: branch });
      sha = fileRes.data.sha;
    } catch (e) {
      // File might not exist
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path, message: message || 'CodeSphere: Auto commit',
      content: Buffer.from(content).toString('base64'),
      sha,
      branch
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const pullRepo = async (req, res) => {
  try {
    const { owner, repo, branch } = req.body;
    const user = await User.findById(req.user.uid);
    if (!user || !user.githubAccessToken) return res.status(400).json({ error: 'GitHub not connected' });

    const AdmZip = require('adm-zip');
    const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`;
    
    const response = await fetch(zipUrl, {
      headers: {
        'Authorization': `token ${user.githubAccessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `GitHub API returned ${response.status}: ${response.statusText}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries(); // an array of ZipEntry records
    
    const files = [];
    
    zipEntries.forEach((zipEntry) => {
      if (!zipEntry.isDirectory) {
        // GitHub zip structure is typically "owner-repo-commitHash/actual/path/to/file.js"
        // We want to strip out the top-level directory.
        const parts = zipEntry.entryName.split('/');
        parts.shift(); // remove the top-level directory
        const actualPath = parts.join('/');
        
        // Skip hidden files or heavy directories to prevent crashes
        if (actualPath.startsWith('.git') || actualPath.includes('node_modules/')) return;
        
        // We only send text files, skip binaries
        const content = zipEntry.getData().toString('utf8');
        files.push({
          path: actualPath,
          content: content
        });
      }
    });

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getRepos, pullFile, pushCommit, pullRepo };

