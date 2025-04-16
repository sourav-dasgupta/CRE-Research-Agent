const fs = require('fs');
const path = require('path');

// Define the directories we need
const directories = [
  'uploads',
  'logs',
  'temp'
];

// Create the directories if they don't exist
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  } else {
    console.log(`Directory already exists: ${dirPath}`);
  }
});

console.log('Setup complete!'); 