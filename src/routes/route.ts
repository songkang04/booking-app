import { Router } from 'express';
import authRoutes from './auth';
import homestayRoutes from './homestay';
import reviewRoutes from './review';

const routes = Router();

// Mount the auth routes
routes.use('/auth', authRoutes);

// Mount the homestay routes
routes.use('/homestays', homestayRoutes);

// Mount the review routes
routes.use('/reviews', reviewRoutes);

export default routes;
