const { execSync } = require('child_process');

console.log('Running custom Vercel installation script...');

// Force install specific versions
try {
  console.log('Installing specific versions...');
  execSync('npm install --legacy-peer-deps @auth/core@0.34.3 @auth/prisma-adapter@1.0.7 next-auth@4.24.7', { stdio: 'inherit' });
  
  console.log('Installing remaining dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Installation completed successfully!');
} catch (error) {
  console.error('Installation failed:', error);
  process.exit(1);
}
