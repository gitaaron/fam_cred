// Simple script to get your local IP address for testing
import { networkInterfaces } from 'os';

function getLocalIP() {
  const interfaces = networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIP();
console.log('\n🌐 Your local IP address is:', ip);
console.log('\n📱 To test on mobile:');
console.log(`   Frontend: http://${ip}:5173`);
console.log(`   API: http://${ip}:3001`);
console.log('\n💻 To test on desktop:');
console.log('   Frontend: http://localhost:5173');
console.log('   API: http://localhost:3001');
console.log('\n🚀 Start both servers:');
console.log('   npm run api    (in one terminal)');
console.log('   npm run dev    (in another terminal)');
console.log('');
