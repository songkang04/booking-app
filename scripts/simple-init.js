const mongoose = require('mongoose');
require('dotenv').config();

async function initSimpleData() {
    try {
        const mongoUser = process.env.MONGO_USER || 'admin';
        const mongoPassword = process.env.MONGO_PASSWORD || 'password';
        const mongoHost = process.env.MONGO_HOST || 'localhost';
        const mongoPort = process.env.MONGO_PORT || '27017';
        const mongoDb = process.env.MONGO_DB || 'booking_app';

        const mongoURI = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDb}?authSource=admin`;

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB connection successful!');

        // Define simple user schema
        const userSchema = new mongoose.Schema({
            firstName: String,
            lastName: String,
            email: { type: String, unique: true },
            password: String,
            role: String,
            isEmailVerified: Boolean,
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });
        
        // Define simple homestay schema
        const homestaySchema = new mongoose.Schema({
            name: String,
            description: String,
            address: String,
            city: String,
            province: String,
            price: Number,
            images: [String],
            hostId: mongoose.Schema.Types.ObjectId,
            isActive: Boolean,
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });

        // Create models
        const User = mongoose.models.User || mongoose.model('User', userSchema);
        const Homestay = mongoose.models.Homestay || mongoose.model('Homestay', homestaySchema);

        // Create test admin user if it doesn't exist
        console.log('Creating test admin user...');
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        
        if (!existingAdmin) {
            const admin = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'password_hash_here',
                role: 'admin',
                isEmailVerified: true
            });
            
            await admin.save();
            console.log('✅ Admin user created successfully!');
        } else {
            console.log('Admin user already exists');
        }

        // Create a test homestay
        console.log('Creating test homestay...');
        const admin = await User.findOne({ email: 'admin@example.com' });
        
        if (admin) {
            const existingHomestay = await Homestay.findOne({ name: 'Test Homestay' });
            
            if (!existingHomestay) {
                const homestay = new Homestay({
                    name: 'Test Homestay',
                    description: 'A test homestay for development',
                    address: '123 Test Street',
                    city: 'Test City',
                    province: 'Test Province',
                    price: 1000000,
                    images: ['https://example.com/image.jpg'],
                    hostId: admin._id,
                    isActive: true
                });
                
                await homestay.save();
                console.log('✅ Test homestay created successfully!');
            } else {
                console.log('Test homestay already exists');
            }
        }

        console.log('Counting documents in collections:');
        const userCount = await User.countDocuments();
        const homestayCount = await Homestay.countDocuments();
        
        console.log(`- Users: ${userCount}`);
        console.log(`- Homestays: ${homestayCount}`);

        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    } catch (error) {
        console.error('❌ Error initializing data:', error);
    } finally {
        process.exit(0);
    }
}

initSimpleData();
