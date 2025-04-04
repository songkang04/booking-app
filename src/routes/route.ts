import { Router } from 'express';
import authRoutes from './auth';
import homestayRoutes from './homestay';

const routes = Router();

// Mount the auth routes
routes.use('/auth', authRoutes);

// Mount the homestay routes
routes.use('/homestays', homestayRoutes);

export default routes;
