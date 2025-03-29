import { Router } from 'express';
import authRoutes from './auth';

const routes = Router();

// Mount the auth routes
routes.use('/auth', authRoutes);

export default routes;
