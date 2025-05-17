import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { AppDataSource } from './config/database';
import routes from './routes/route';

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const createUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  const qrcodesDir = path.join(uploadsDir, 'qrcodes');

  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(qrcodesDir, { recursive: true });
    console.log('Upload directories created or already exist');
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
};

createUploadsDir();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to database
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
    // Routes
    app.use('/api', routes);

    // Health check
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error during Data Source initialization:', err);
  });

export default app;
