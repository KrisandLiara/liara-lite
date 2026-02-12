import './config.js'; // This MUST be the first import to load environment variables

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import liteRoutes from './routes/liteRoutes.js';

// Configure dotenv to load the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '50mb' }));

// Routes (Liara Lite: only lite endpoints)
app.use('/api/lite', liteRoutes);


// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
    const __dirname = path.resolve();
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
    });
}


app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
});