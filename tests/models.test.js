const Node = require('../models/Node');
const User = require('../models/User');
const { setupTestDB, teardownTestDB, clearTestDB, createTestHierarchy, createTestUsers } = require('./setup');

describe('Node Model', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('getDescendantIds', () => {
    it('should return all descendant IDs', async () => {
      const nodes = await createTestHierarchy();
      
      const descendantIds = await Node.getDescendantIds(nodes.noviBeograd._id);
      
      expect(descendantIds.length).toBe(2);
      expect(descendantIds.map(id => id.toString())).toContain(nodes.bezanija._id.toString());
      expect(descendantIds.map(id => id.toString())).toContain(nodes.radnja6._id.toString());
    });

    it('should return empty array for leaf node', async () => {
      const nodes = await createTestHierarchy();
      
      const descendantIds = await Node.getDescendantIds(nodes.radnja6._id);
      
      expect(descendantIds.length).toBe(0);
    });
  });

  describe('getNodeWithDescendantIds', () => {
    it('should include the node itself plus descendants', async () => {
      const nodes = await createTestHierarchy();
      
      const allIds = await Node.getNodeWithDescendantIds(nodes.noviBeograd._id);
      
      expect(allIds.length).toBe(3);
      expect(allIds.map(id => id.toString())).toContain(nodes.noviBeograd._id.toString());
      expect(allIds.map(id => id.toString())).toContain(nodes.bezanija._id.toString());
      expect(allIds.map(id => id.toString())).toContain(nodes.radnja6._id.toString());
    });
  });

  describe('ancestors array', () => {
    it('should correctly track full ancestor path', async () => {
      const nodes = await createTestHierarchy();
      
      expect(nodes.radnja6.ancestors.length).toBe(4);
      expect(nodes.radnja6.ancestors.map(id => id.toString())).toContain(nodes.srbija._id.toString());
      expect(nodes.radnja6.ancestors.map(id => id.toString())).toContain(nodes.gradBeograd._id.toString());
      expect(nodes.radnja6.ancestors.map(id => id.toString())).toContain(nodes.noviBeograd._id.toString());
      expect(nodes.radnja6.ancestors.map(id => id.toString())).toContain(nodes.bezanija._id.toString());
    });
  });
});

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('password hashing', () => {
    it('should hash password on save', async () => {
      const nodes = await createTestHierarchy();
      
      const user = await User.create({
        name: 'Test',
        lastName: 'User',
        username: 'testuser',
        password: 'plaintext',
        role: 'employee',
        nodeId: nodes.srbija._id
      });

      expect(user.password).not.toBe('plaintext');
      expect(user.password.startsWith('$2b$')).toBe(true);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const nodes = await createTestHierarchy();
      
      const user = await User.create({
        name: 'Test',
        lastName: 'User',
        username: 'testuser',
        password: 'mypassword',
        role: 'employee',
        nodeId: nodes.srbija._id
      });

      const isMatch = await user.comparePassword('mypassword');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const nodes = await createTestHierarchy();
      
      const user = await User.create({
        name: 'Test',
        lastName: 'User',
        username: 'testuser',
        password: 'mypassword',
        role: 'employee',
        nodeId: nodes.srbija._id
      });

      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should exclude password from JSON output', async () => {
      const nodes = await createTestHierarchy();
      
      const user = await User.create({
        name: 'Test',
        lastName: 'User',
        username: 'testuser',
        password: 'mypassword',
        role: 'employee',
        nodeId: nodes.srbija._id
      });

      const json = user.toJSON();
      expect(json.password).toBeUndefined();
      expect(json.username).toBe('testuser');
    });
  });
});