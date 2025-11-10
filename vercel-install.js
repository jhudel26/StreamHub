const { execSync } = require('child_process');

console.log('Running custom Vercel installation script...');

// Set the correct Prisma engine for Vercel
process.env.PRISMA_CLI_BINARY_TARGETS = 'rhel-openssl-1.0.x';

try {
  console.log('Installing specific versions...');
  execSync('npm install --legacy-peer-deps @auth/core@0.34.3 @auth/prisma-adapter@1.0.7 next-auth@4.24.7 prisma@5.7.1', { stdio: 'inherit' });
  
  console.log('Installing remaining dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  console.log('Generating Prisma client...');
  execSync('npx prisma generate --generator client', { stdio: 'inherit' });
  
  console.log('Installation completed successfully!');
} catch (error) {
  console.error('Installation failed:', error);
  process.exit(1);
}
