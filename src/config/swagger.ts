import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Booking App API',
      version: '1.0.0',
      description: 'API documentation for Booking App Backend',
      contact: {
        name: 'API Support',
        email: 'support@bookingapp.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: 'Development Server',
      },
      {
        url: 'https://api.bookingapp.com/api',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using Bearer scheme',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            avatar: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
            },
            isEmailVerified: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Homestay: {
          type: 'object',
          required: ['title', 'location', 'description', 'price', 'capacity'],
          properties: {
            _id: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            location: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            price: {
              type: 'number',
            },
            capacity: {
              type: 'number',
            },
            amenities: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            rating: {
              type: 'number',
              minimum: 0,
              maximum: 5,
            },
            reviewCount: {
              type: 'number',
            },
            owner: {
              type: 'string',
              description: 'Owner user ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Booking: {
          type: 'object',
          required: ['homestay', 'user', 'checkInDate', 'checkOutDate', 'totalPrice'],
          properties: {
            _id: {
              type: 'string',
            },
            homestay: {
              type: 'string',
              description: 'Homestay ID',
            },
            user: {
              type: 'string',
              description: 'User ID',
            },
            checkInDate: {
              type: 'string',
              format: 'date',
            },
            checkOutDate: {
              type: 'string',
              format: 'date',
            },
            numberOfGuests: {
              type: 'number',
            },
            totalPrice: {
              type: 'number',
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            },
            specialRequest: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Review: {
          type: 'object',
          required: ['homestay', 'user', 'rating', 'comment'],
          properties: {
            _id: {
              type: 'string',
            },
            homestay: {
              type: 'string',
              description: 'Homestay ID',
            },
            user: {
              type: 'string',
              description: 'User ID',
            },
            rating: {
              type: 'number',
              minimum: 1,
              maximum: 5,
            },
            comment: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            message: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
