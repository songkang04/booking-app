import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import routes from './routes/route';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
