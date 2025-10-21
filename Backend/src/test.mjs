import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('C:/Users/risha/Desktop/AI Interview/Backend/src/.env') });
console.log('TEST MONGODB URI:', process.env.MONGODB_URI);
