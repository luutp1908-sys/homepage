const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = unquote(line.slice(separatorIndex + 1).trim());

    if (!key) continue;
    process.env[key] = value;
  }
}

function runNextCommand(projectRoot, nextBin, command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, command, ...args], {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }

      if (code && code !== 0) {
        reject(new Error(`next ${command} failed with exit code ${code}`));
        return;
      }

      resolve();
    });

    child.on('error', reject);
  });
}

const projectRoot = path.resolve(__dirname, '..');
const envFile = path.join(projectRoot, '.env.production');
loadEnvFile(envFile);

const nextBin = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
const buildIdPath = path.join(projectRoot, '.next', 'BUILD_ID');
const startArgs = process.argv.slice(2);
const shouldSkipBuild = startArgs.includes('--help') || startArgs.includes('-h') || startArgs.includes('--version');

(async () => {
  try {
    if (!shouldSkipBuild && !fs.existsSync(buildIdPath)) {
      console.log('No production build found. Running next build...');
      await runNextCommand(projectRoot, nextBin, 'build');
    }

    await runNextCommand(projectRoot, nextBin, 'start', startArgs);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
})();
