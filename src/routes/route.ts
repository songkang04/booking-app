import { Router } from 'express';
import authRoutes from './auth';
import homestayRoutes from './homestay';
import reviewRoutes from './review';
import bookingRoutes from './booking';
import paymentRoutes from './payment';
import adminRoutes from './admin';

const routes = Router();

// Mount the auth routes
routes.use('/auth', authRoutes);

// Mount the homestay routes
routes.use('/homestays', homestayRoutes);

// Mount the review routes
routes.use('/reviews', reviewRoutes);

// Mount the booking routes
routes.use('/bookings', bookingRoutes);

// Mount the payment routes - the routes themselves already include /bookings prefix
routes.use('/', paymentRoutes);

// Mount the admin routes
routes.use('/admin', adminRoutes);

export default routes;
