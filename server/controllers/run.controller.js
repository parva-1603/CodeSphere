const { exec } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');

const findCompiler = (lang) => {
  const isC = lang === 'c';
  const binaryName = isC ? 'gcc.exe' : 'g++.exe';

  const candidates = [
    `P:\\MinGW\\bin\\${binaryName}`,
    `C:\\MinGW\\bin\\${binaryName}`,
    `C:\\msys64\\mingw64\\bin\\${binaryName}`,
    `C:\\mingw64\\bin\\${binaryName}`,
    isC ? 'gcc' : 'g++'
  ];

  for (const cand of candidates) {
    if (cand.includes('\\')) {
      if (fsSync.existsSync(cand)) {
        return { command: cand, dir: path.dirname(cand) };
      }
    } else {
      return { command: cand, dir: '' };
    }
  }

  return { command: isC ? 'gcc' : 'g++', dir: 'P:\\MinGW\\bin' };
};

const runCode = async (req, res) => {
  const { code, language } = req.body;
  if (typeof code !== 'string') return res.status(400).json({ error: 'Code is required' });

  try {
    const tmpDir = os.tmpdir();
    let ext = 'txt';
    let command = '';
    let compilerDir = '';
    let isCompiled = false;
    let exeFilename = '';

    const lang = (language || 'javascript').toLowerCase();

    if (lang === 'javascript' || lang === 'js') {
      ext = 'js';
      command = 'node';
    } else if (lang === 'python' || lang === 'py') {
      ext = 'py';
      command = 'python';
    } else if (lang === 'cpp' || lang === 'c' || lang === 'c++') {
      ext = (lang === 'c') ? 'c' : 'cpp';
      const compilerInfo = findCompiler(lang === 'c' ? 'c' : 'cpp');
      command = compilerInfo.command;
      compilerDir = compilerInfo.dir || 'P:\\MinGW\\bin';
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
      fullCommand = `"${command}" -static "${filepath}" -o "${exeFilename}" && "${exeFilename}"`;
    } else {
      fullCommand = `"${command}" "${filepath}"`;
    }

    const customPath = compilerDir
      ? `${compilerDir};${process.env.PATH || ''}`
      : process.env.PATH;

    const execOptions = {
      timeout: 10000,
      env: {
        ...process.env,
        PATH: customPath
      }
    };

    exec(fullCommand, execOptions, async (error, stdout, stderr) => {
      // Clean up temporary files
      await fs.unlink(filepath).catch(() => {});
      if (isCompiled) {
        await fs.unlink(exeFilename).catch(() => {});
      }
      
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;

      if (error && !stdout && !stderr) {
        output += `Execution failed (${error.message || 'Exit code ' + error.code}). Check your code for syntax errors or missing dependencies.`;
      }

      res.json({ output: output || '\r\n(No output)' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { runCode };
