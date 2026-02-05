const request = require('supertest');
const app = require('../app');
const Node = require('../models/Node');
const { setupTestDB, teardownTestDB, clearTestDB, createTestHierarchy, createTestUsers } = require('./setup');

describe('Node Routes', () => {
  let nodes, users, ceoToken, noviBeogradManagerToken, bezanijaEmployeeToken;

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
  });

  describe('GET /api/nodes', () => {
    it('should return accessible nodes for user', async () => {
      const res = await request(app)
        .get('/api/nodes')
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.nodes).toBeDefined();
      expect(res.body.nodes.some(n => n.name === 'Novi Beograd')).toBe(true);
      expect(res.body.nodes.some(n => n.name === 'Bezanija')).toBe(true);
      expect(res.body.nodes.some(n => n.name === 'Radnja 6')).toBe(true);
      expect(res.body.nodes.some(n => n.name === 'Vojvodina')).toBe(false);
    });

    it('CEO should see all nodes', async () => {
      const res = await request(app)
        .get('/api/nodes')
        .set('Authorization', `Bearer ${ceoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(8);
    });
  });

  describe('GET /api/nodes/:nodeId', () => {
    it('should return node details for accessible node', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.bezanija._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.node.name).toBe('Bezanija');
    });

    it('should reject access to non-descendant node', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.vojvodina._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/nodes/:nodeId/descendants', () => {
    it('should return all descendants of a node', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.noviBeograd._id}/descendants`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.descendants.some(n => n.name === 'Bezanija')).toBe(true);
      expect(res.body.descendants.some(n => n.name === 'Radnja 6')).toBe(true);
    });
  });

  describe('GET /api/nodes/:nodeId/children', () => {
    it('should return direct children only', async () => {
      const res = await request(app)
        .get(`/api/nodes/${nodes.noviBeograd._id}/children`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.children.length).toBe(1);
      expect(res.body.children[0].name).toBe('Bezanija');
    });
  });

  describe('POST /api/nodes (Create Node)', () => {
    it('Manager should create node under own node', async () => {
      const res = await request(app)
        .post('/api/nodes')
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`)
        .send({
          name: 'New Office',
          type: 'office',
          parentId: nodes.noviBeograd._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.node.name).toBe('New Office');
      expect(res.body.node.ancestors.length).toBe(3);
    });

    it('Manager should create node under descendant node', async () => {
      const res = await request(app)
        .post('/api/nodes')
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`)
        .send({
          name: 'New Store',
          type: 'store',
          parentId: nodes.bezanija._id.toString()
        });

      expect(res.status).toBe(201);
    });

    it('Manager should NOT create node under non-descendant node', async () => {
      const res = await request(app)
        .post('/api/nodes')
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`)
        .send({
          name: 'Illegal Node',
          type: 'office',
          parentId: nodes.vojvodina._id.toString()
        });

      expect(res.status).toBe(403);
    });

    it('Employee should NOT create nodes', async () => {
      const res = await request(app)
        .post('/api/nodes')
        .set('Authorization', `Bearer ${bezanijaEmployeeToken}`)
        .send({
          name: 'Illegal Node',
          type: 'office',
          parentId: nodes.bezanija._id.toString()
        });

      expect(res.status).toBe(403);
    });

    it('should reject invalid type', async () => {
      const res = await request(app)
        .post('/api/nodes')
        .set('Authorization', `Bearer ${ceoToken}`)
        .send({
          name: 'Test',
          type: 'invalid',
          parentId: nodes.srbija._id.toString()
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/nodes/:nodeId (Update Node)', () => {
    it('Manager should update accessible node', async () => {
      const res = await request(app)
        .put(`/api/nodes/${nodes.bezanija._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`)
        .send({ name: 'Updated Bezanija' });

      expect(res.status).toBe(200);
      expect(res.body.node.name).toBe('Updated Bezanija');
    });

    it('Manager should NOT update non-descendant node', async () => {
      const res = await request(app)
        .put(`/api/nodes/${nodes.vojvodina._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/nodes/:nodeId (Delete Node)', () => {
    it('Manager should delete empty leaf node', async () => {
      const emptyNode = await Node.create({
        name: 'Empty Node',
        type: 'store',
        parentId: nodes.bezanija._id,
        ancestors: [...nodes.bezanija.ancestors, nodes.bezanija._id]
      });

      const res = await request(app)
        .delete(`/api/nodes/${emptyNode._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(200);
    });

    it('Manager should NOT delete node with children', async () => {
      const res = await request(app)
        .delete(`/api/nodes/${nodes.bezanija._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Cannot delete node with children. Delete children first.');
    });

    it('Manager should NOT delete node with users', async () => {
      const res = await request(app)
        .delete(`/api/nodes/${nodes.radnja6._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Cannot delete node with assigned users. Reassign users first.');
    });

    it('Manager should NOT delete their own node', async () => {
      const res = await request(app)
        .delete(`/api/nodes/${nodes.noviBeograd._id}`)
        .set('Authorization', `Bearer ${noviBeogradManagerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Cannot delete your own node');
    });
  });
});