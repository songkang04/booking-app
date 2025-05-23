# MySQL to MongoDB Migration Guide

This document outlines how we migrated from MySQL to MongoDB for the Booking App.

## Migration Overview

The Booking App was originally built using MySQL and TypeORM. We've completely migrated the database layer to use MongoDB with Mongoose. Here's a summary of the changes:

1. Replaced MySQL with MongoDB in `docker-compose.yml`
2. Created MongoDB schemas to replace TypeORM entities
3. Updated services to use Mongoose instead of TypeORM
4. Removed all MySQL dependencies and configuration
5. Updated controllers and middleware to work with MongoDB

## Infrastructure Changes

### Docker Configuration

- Replaced MySQL with MongoDB in `docker-compose.yml`
- Added mongo-express for easy web-based MongoDB management
- Added initialization script in `mongo-init` folder

### Dependencies

- Added: `mongoose`, `mongoose-delete`, `mongoose-paginate-v2`
- Removed: `mysql2`, `typeorm`

## Schema Changes

Created MongoDB schema files for all entities:

### Key Schema Features

- **Text Indexing**: Added text indexes for search functionality
- **Validation**: Added field-level validation in schemas
- **Relationships**: Defined proper references between collections
- **Middleware**: Added hooks for password hashing, timestamps, etc.

## Service Layer Changes

All services were updated to use Mongoose instead of TypeORM:

- Replaced `repository.save()` with `.save()`
- Replaced `repository.find()` with `.find()`
- Replaced `repository.findOneBy()` with `.findOne()` or `.findById()`
- Updated query operators (e.g., `MoreThan()` became `{ $gt: ... }`)

## Controller Updates

The API endpoints remain the same, but controllers were updated to work with MongoDB models:

- Updated ID handling (string IDs instead of numeric)
- Adapted to MongoDB document structure
- Updated error handling for MongoDB specific errors

## MongoDB Initialization

We've created:

1. A MongoDB initialization script in `mongo-init/init-mongo.js` that runs when the container starts
2. A data seeding script that can be run with:

```bash
npm run init:mongodb
```

## Testing the Migration

To test the MongoDB connection:

```bash
npm run test:mongodb
```

This script will verify:
- Connection to MongoDB
- Available collections
- Database statistics

## Running the Application

1. Start the MongoDB database:

```bash
docker-compose up -d
```

2. Update your `.env` file with MongoDB connection settings:

```
MONGO_USER=admin
MONGO_PASSWORD=password
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB=booking_app
```

3. Start the application:

```bash
npm run dev
```

## Performance Considerations

- Text search is more efficient with MongoDB text indexes
- Simplified document structure improves read operations
- Reduced JOINs by embedding related data where appropriate

## Future Optimizations

1. **Data Backups**: Configure regular MongoDB backups
2. **Indexing Strategy**: Optimize indexes based on actual query patterns
3. **Sharding**: Consider sharding for horizontal scaling if needed
2. Restore MySQL database from backup
3. Update environment configuration to use MySQL again
