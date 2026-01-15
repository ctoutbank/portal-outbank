import { matchPassword, hashPassword } from './src/app/utils/password';
import bcrypt from 'bcryptjs';

async function measureHashPerformance() {
    const password = 'test-password-performance-check';

    console.log('--- Measuring Password Hash Performance ---');

    // Bcrypt (Old)
    const bcryptStart = performance.now();
    const bcryptHash = await bcrypt.hash(password, 10);
    const bcryptVerify = await bcrypt.compare(password, bcryptHash);
    const bcryptEnd = performance.now();
    console.log(`Bcrypt: ${(bcryptEnd - bcryptStart).toFixed(2)}ms (Hash + Verify)`);

    // Scrypt (New)
    const scryptStart = performance.now();
    const scryptHash = await hashPassword(password);
    const scryptVerify = await matchPassword(password, scryptHash);
    const scryptEnd = performance.now();
    console.log(`Scrypt: ${(scryptEnd - scryptStart).toFixed(2)}ms (Hash + Verify)`);
}

measureHashPerformance().catch(console.error);
