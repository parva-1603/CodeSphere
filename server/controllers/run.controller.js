const { exec } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');

const findCompiler = (lang) => {
  const isC = lang === 'c';
  const binaryName = isC ? 'gcc.exe' : 'g++.exe';

  const candidates = [
    `C:\\MinGW\\bin\\${binaryName}`,
    `C:\\msys64\\mingw64\\bin\\${binaryName}`,
    `C:\\msys64\\ucrt64\\bin\\${binaryName}`,
    `C:\\mingw64\\bin\\${binaryName}`,
    `P:\\MinGW\\bin\\${binaryName}`,
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

  return { command: isC ? 'gcc' : 'g++', dir: 'C:\\MinGW\\bin' };
};

const runCode = async (req, res) => {
  const { code, language } = req.body;
  if (typeof code !== 'string') return res.status(400).json({ error: 'Code is required' });

  if (!code.trim()) {
    return res.json({ 
      output: '⚠️ Notice: Code is empty. Nothing to execute.\r\n', 
      success: true,
      exitCode: 0 
    });
  }

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
    } else if (lang === 'c') {
      ext = 'c';
      const compilerInfo = findCompiler('c');
      command = compilerInfo.command;
      compilerDir = compilerInfo.dir || 'C:\\MinGW\\bin';
      isCompiled = true;
    } else if (lang === 'cpp' || lang === 'c++') {
      ext = 'cpp';
      const compilerInfo = findCompiler('cpp');
      command = compilerInfo.command;
      compilerDir = compilerInfo.dir || 'C:\\MinGW\\bin';
      isCompiled = true;
    } else if (lang === 'java') {
      ext = 'java';
      command = 'java';
    } else {
      return res.status(400).json({ error: `Language "${language}" is not currently supported for execution` });
    }

    const baseName = `run_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const filename = `${baseName}.${ext}`;
    const filepath = path.join(tmpDir, filename);

    await fs.writeFile(filepath, code, 'utf8');

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
      maxBuffer: 1024 * 1024 * 2, // 2MB output buffer
      env: {
        ...process.env,
        PATH: customPath
      }
    };

    const startTime = Date.now();

    exec(fullCommand, execOptions, async (error, stdout, stderr) => {
      const durationMs = Date.now() - startTime;

      // Clean up temporary files safely
      await fs.unlink(filepath).catch(() => {});
      if (isCompiled) {
        await fs.unlink(exeFilename).catch(() => {});
      }
      
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;

      if (error) {
        if (error.killed) {
          output += `\r\n⏱️ Execution timed out (10s limit). If your program requires interactive user input (e.g., scanf / cin / input), please use the integrated Terminal tab.`;
        } else if (!stdout && !stderr) {
          output += `\r\n❌ Execution failed: ${error.message || 'Exit code ' + error.code}`;
        }
      }

      res.json({ 
        output: output || '\r\n(No output)',
        success: !error,
        exitCode: error ? (error.code || 1) : 0,
        duration: durationMs
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { runCode };

