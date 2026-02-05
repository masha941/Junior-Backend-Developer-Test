const request = require('supertest');
const app = require('../app');
const { setupTestDB, teardownTestDB, clearTestDB, createTestHierarchy, createTestUsers } = require('./setup');

describe('Auth Routes', () => {
  let nodes, users;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    nodes = await createTestHierarchy();
    users = await createTestUsers(nodes);
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'petar_ceo', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('petar_ceo');
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject invalid username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'petar_ceo', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username and password are required');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          lastName: 'User',
          username: 'testuser',
          password: 'testpass123',
          role: 'employee',
          nodeId: nodes.srbija._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('testuser');
    });

    it('should reject duplicate username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          lastName: 'User',
          username: 'petar_ceo',
          password: 'testpass123',
          nodeId: nodes.srbija._id.toString()
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Username already exists');
    });

    it('should reject invalid nodeId', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          lastName: 'User',
          username: 'testuser',
          password: 'testpass123',
          nodeId: '507f1f77bcf86cd799439011'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Node not found');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'petar_ceo', password: 'password123' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('petar_ceo');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.status).toBe(401);
    });
  });
});