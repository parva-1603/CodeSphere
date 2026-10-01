const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const runCode = async (req, res) => {
  const { code, language } = req.body;
  if (typeof code !== 'string') return res.status(400).json({ error: 'Code is required' });

  try {
    const tmpDir = os.tmpdir();
    let ext = 'txt';
    let command = '';
    let isCompiled = false;
    let exeFilename = '';

    if (language === 'javascript') {
      ext = 'js';
      command = 'node';
    } else if (language === 'python') {
      ext = 'py';
      command = 'python';
    } else if (language === 'cpp' || language === 'c') {
      ext = language === 'c' ? 'c' : 'cpp';
      // Use absolute path without quotes to prevent cmd.exe from stripping quotes incorrectly
      command = language === 'c' ? 'P:\\MinGW\\bin\\gcc' : 'P:\\MinGW\\bin\\g++';
      isCompiled = true;
    } else {
      return res.status(400).json({ error: `Language ${language} not supported for running` });
    }

    const baseName = `run_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const filename = `${baseName}.${ext}`;
    const filepath = path.join(tmpDir, filename);

    await fs.writeFile(filepath, code);

    let fullCommand = '';
    if (isCompiled) {
      exeFilename = path.join(tmpDir, `${baseName}.exe`);
      fullCommand = `${command} "${filepath}" -o "${exeFilename}" && "${exeFilename}"`;
    } else {
      fullCommand = `${command} "${filepath}"`;
    }

    exec(fullCommand, { timeout: 10000 }, async (error, stdout, stderr) => {
      // Clean up file without logging annoying ENOENT errors
      await fs.unlink(filepath).catch(() => {});
      if (isCompiled) {
        await fs.unlink(exeFilename).catch(() => {});
      }
      
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;
      // Hide generic Node "Command failed" message if possible
      if (error && !stdout && !stderr) {
        output += "Execution failed or compiler error. Check your code for syntax errors.";
      }

      res.json({ output: output || '\r\n(No output)' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { runCode };
