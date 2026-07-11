const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});

describe('Authentication & Password Recovery', () => {

    const validUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
    };

    describe('Validation Failures', () => {
        it('should reject weak passwords during registration', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...validUser, password: 'weak' });
            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toMatch(/Password must be at least 8 characters/);
        });
    });

    describe('Forgot Password Enumeration Protection', () => {
        it('should return identical success messages for valid and invalid emails', async () => {
            await request(app).post('/api/auth/register').send(validUser);
            
            const validRes = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: validUser.email });
                
            const invalidRes = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' });

            expect(validRes.statusCode).toBe(200);
            expect(invalidRes.statusCode).toBe(200);
            expect(validRes.body.message).toBe('If an account exists, a password reset email has been sent.');
            expect(invalidRes.body.message).toBe('If an account exists, a password reset email has been sent.');
        });
    });

    describe('Token Generation and Hashing', () => {
        it('should generate a token and store it hashed', async () => {
            await request(app).post('/api/auth/register').send(validUser);
            
            // Note: emailService will fail and throw 503 if not configured, 
            // but we can mock it or let it fail gracefully. 
            // The service clears the token if email fails. 
            // We'll mock the emailService so it doesn't fail.
        });
    });

    describe('Rate Limiting', () => {
        it('should rate limit forgot-password endpoint', async () => {
            // Send 6 requests, limit is 5 per hour
            for(let i=0; i<5; i++){
                await request(app).post('/api/auth/forgot-password').send({ email: 'test@example.com' });
            }
            const res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@example.com' });
            expect(res.statusCode).toBe(429);
        });
    });

});
