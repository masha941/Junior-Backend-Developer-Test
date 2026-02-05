const request = require('supertest');
const app = require('../app');
const { setupTestDB, teardownTestDB, clearTestDB, createTestHierarchy, createTestUsers } = require('./setup');

describe('User Routes - Access Control', () => {
  let nodes, users, ceoToken, noviBeogradManagerToken, bezanijaEmployeeToken, vojvodinaManagerToken;

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

    const ceoLogin = await request(app).post('/api/auth/login').send({ username: 'petar_ceo', password: 'password123' });
    ceoToken = ceoLogin.body.token;

    const nbLogin = await request(app).post('/api/auth/login').send({ username: 'jovan_novibeograd', password: 'password123' });
    noviBeogradManagerToken = nbLogin.body.token;

    const empLogin = await request(app).post('/api/auth/login').send({ username: 'dejan_emp_bezanija', password: 'password123' });
    bezanijaEmployeeToken = empLogin.body.token;

    const vojLogin = await request(app).post('/api/auth/login').send({ username: 'ana_vojvodina', password: 'password123' });
    vojvodinaManagerToken = vojLogin.body.token;
  });

  describe('GET /api/nodes/:nodeId/employees', () => {
    it('CEO manager should see employees in any descendant node', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.bezanija._id}/employees`)
        .set('Authorization', `Bearer ${ceoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.employees).toBeDefined();
    });

    it('Novi Beograd manager should see employees in Bezanija (descendant)', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.bezanija._id}/employees`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.employees.some(e => e.username === 'dejan_emp_bezanija')).toBe(true);
    });

    it('Novi Beograd manager should see employees in Radnja 6 (descendant of descendant)', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.radnja6._id}/employees`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.employees.some(e => e.username === 'igor_emp_radnja6')).toBe(true);
    });

    it('Novi Beograd manager should NOT see employees in Vojvodina (not descendant)', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.vojvodina._id}/employees`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied to this node');
    });

    it('Vojvodina manager should NOT see employees in Novi Beograd (different branch)', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.noviBeograd._id}/employees`)
        .set('Authorization', `Bearer ${vojvodinaManagerToken}`);

      expect(res.status).toBe(403);
    });

    it('Employee should see employees in own node', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.bezanija._id}/employees`)
        .set('Authorization', `Bearer ${bezanijaEmployeeToken}`);

      expect(res.status).toBe(200);
    });

    it('Employee should see employees in descendant nodes', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.radnja6._id}/employees`)
        .set('Authorization', `Bearer ${bezanijaEmployeeToken}`);

      expect(res.status).toBe(200);
    });

    it('should return employees with descendants when includeDescendants=true', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.noviBeograd._id}/employees?includeDescendants=true`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.employees.some(e => e.username === 'dejan_emp_bezanija')).toBe(true);
      expect(res.body.employees.some(e => e.username === 'igor_emp_radnja6')).toBe(true);
    });
  });

  describe('GET /api/nodes/:nodeId/managers', () => {
    it('Manager should see managers in own and descendant nodes', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.noviBeograd._id}/managers`)
        .set('Authorization', `Bearer ${ceoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.managers.some(m => m.username === 'jovan_novibeograd')).toBe(true);
    });

    it('Employee should NOT see managers', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.bezanija._id}/managers`)
        .set('Authorization', `Bearer ${bezanijaEmployeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Only managers can view other managers');
    });

    it('Manager should see managers with descendants when includeDescendants=true', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.srbija._id}/managers?includeDescendants=true`)
        .set('Authorization', `Bearer ${ceoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.managers.length).toBeGreaterThan(1);
    });
  });

  describe('POST /api/nodes/:nodeId/users (Create User)', () => {
    it('Manager should create user in own node', async () => {
      const res = await request(app)
        .post(`/api/nodes/${nodes.noviBeograd._id}/users`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`)
        .send({
          name: 'New',
          lastName: 'Employee',
          username: 'new_employee',
          password: 'pass123',
          role: 'employee'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.username).toBe('new_employee');
    });

    it('Manager should create user in descendant node', async () => {
      const res = await request(app)
        .post(`/api/nodes/${nodes.bezanija._id}/users`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`)
        .send({
          name: 'New',
          lastName: 'Employee',
          username: 'new_bezanija_emp',
          password: 'pass123',
          role: 'employee'
        });

      expect(res.status).toBe(201);
    });

    it('Manager should NOT create user in non-descendant node', async () => {
      const res = await request(app)
        .post(`/api/nodes/${nodes.vojvodina._id}/users`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`)
        .send({
          name: 'New',
          lastName: 'Employee',
          username: 'new_vojvodina_emp',
          password: 'pass123',
          role: 'employee'
        });

      expect(res.status).toBe(403);
    });

    it('Employee should NOT create users', async () => {
      const res = await request(app)
        .post(`/api/nodes/${nodes.bezanija._id}/users`)
        .set('Authorization', `Bearer ${bezanijaEmployeeToken}`)
        .send({
          name: 'New',
          lastName: 'Employee',
          username: 'new_emp',
          password: 'pass123'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/nodes/users/:userId (Update User)', () => {
    it('Manager should update user in own node', async () => {
      const res = await request(app)
        .put(`/api/nodes/users/${users.bezanijaEmployee._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Name');
    });

    it('Manager should NOT update user in non-descendant node', async () => {
      const res = await request(app)
        .put(`/api/nodes/users/${users.vojvodinaManager._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
    });

    it('Employee should NOT update users', async () => {
      const res = await request(app)
        .put(`/api/nodes/users/${users.radnja6Employee._id}`)
        .set('Authorization', `Bearer ${bezanijaEmployeeToken}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/nodes/users/:userId (Delete User)', () => {
    it('Manager should delete user in descendant node', async () => {
      const res = await request(app)
        .delete(`/api/nodes/users/${users.bezanijaEmployee._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');
    });

    it('Manager should NOT delete themselves', async () => {
      const res = await request(app)
        .delete(`/api/nodes/users/${users.noviBeogradManager._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Cannot delete yourself');
    });

    it('Manager should NOT delete user in non-descendant node', async () => {
      const res = await request(app)
        .delete(`/api/nodes/users/${users.vojvodinaManager._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(403);
    });
  });
});