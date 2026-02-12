import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This resolves the path from /liara-backend/src/ to the project root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); 