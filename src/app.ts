import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import swaggerUi from 'swagger-ui-express';
import { connectMongoDB } from './config/mongodb';
import { swaggerSpec } from './config/swagger';
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

// Swagger documentation
// app.use('/api-docs', swaggerUi.serve);
// app.use('/api-docs', swaggerUi.setup(swaggerSpec));
// app.get('/api-docs-json', (req, res) => {
//   res.setHeader('Content-Type', 'application/json');
//   res.send(swaggerSpec);
// });

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();

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
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
