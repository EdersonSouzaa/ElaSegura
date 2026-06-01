const fs = require('fs');
const path = require('path');

// Simple parser for .env files without external dependencies
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      env[match[1]] = value;
    }
  });
  return env;
}

module.exports = ({ config }) => {
  const serverEnvPath = path.resolve(__dirname, '../server/.env');
  const serverEnv = loadEnv(serverEnvPath);
  const serverPort = serverEnv.PORT || '3000';

  return {
    ...config,
    extra: {
      ...config.extra,
      serverPort: serverPort,
    },
  };
};
