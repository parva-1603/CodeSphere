const { exec } = require('child_process');

const executeCommand = async (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  // Execute the command in the context of the server
  // Note: This is highly insecure for production and should be containerized, 
  // but works for a local development web IDE.
  exec(command, { cwd: process.cwd(), timeout: 10000 }, (error, stdout, stderr) => {
    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += stderr;
    if (error && !stdout && !stderr) output += error.message;
    
    res.json({ output: output || 'Command executed successfully with no output.' });
  });
};

module.exports = { executeCommand };
