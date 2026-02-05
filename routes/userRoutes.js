const express = require('express');
const User = require('../models/User');
const Node = require('../models/Node');
const { authenticate, authorize, canAccessNode, canManageUser } = require('../middleware/auth');

const router = express.Router();

router.get('/:nodeId/employees', authenticate, canAccessNode, async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { includeDescendants } = req.query;

    let nodeIds = [nodeId];
    
    if (includeDescendants === 'true') {
      nodeIds = await Node.getNodeWithDescendantIds(nodeId);
    }

    const employees = await User.find({ 
      nodeId: { $in: nodeIds },
      role: 'employee'
    }).populate('nodeId');

    res.json({ employees, count: employees.length });
  } catch (error) {
    next(error);
  }
});

router.get('/:nodeId/managers', authenticate, canAccessNode, async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { includeDescendants } = req.query;

    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can view other managers' });
    }

    let nodeIds = [nodeId];
    
    if (includeDescendants === 'true') {
      nodeIds = await Node.getNodeWithDescendantIds(nodeId);
    }

    const managers = await User.find({ 
      nodeId: { $in: nodeIds },
      role: 'manager'
    }).populate('nodeId');

    res.json({ managers, count: managers.length });
  } catch (error) {
    next(error);
  }
});

router.get('/:nodeId/users', authenticate, canAccessNode, async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { includeDescendants, role } = req.query;

    let nodeIds = [nodeId];
    
    if (includeDescendants === 'true') {
      nodeIds = await Node.getNodeWithDescendantIds(nodeId);
    }

    const query = { nodeId: { $in: nodeIds } };
    
    if (req.user.role === 'employee') {
      query.role = 'employee';
    } else if (role) {
      query.role = role;
    }

    const users = await User.find(query).populate('nodeId');

    res.json({ users, count: users.length });
  } catch (error) {
    next(error);
  }
});

router.post('/:nodeId/users', authenticate, authorize('manager'), canAccessNode, async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { name, lastName, username, password, role } = req.body;

    if (!name || !lastName || !username || !password) {
      return res.status(400).json({ message: 'Name, lastName, username, and password are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const user = new User({
      name,
      lastName,
      username,
      password,
      role: role || 'employee',
      nodeId
    });

    await user.save();
    await user.populate('nodeId');

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    next(error);
  }
});

router.get('/users/:userId', authenticate, canManageUser, async (req, res, next) => {
  try {
    const user = req.targetUser;
    
    if (req.user.role === 'employee' && user.role === 'manager') {
      return res.status(403).json({ message: 'Employees cannot view manager details' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:userId', authenticate, authorize('manager'), canManageUser, async (req, res, next) => {
  try {
    const { name, lastName, username, role, nodeId } = req.body;
    const user = req.targetUser;

    if (nodeId && nodeId !== user.nodeId.toString()) {
      const userNodeId = req.user.nodeId._id || req.user.nodeId;
      const newNode = await Node.findById(nodeId);
      
      if (!newNode) {
        return res.status(404).json({ message: 'Target node not found' });
      }

      const isOwnNode = userNodeId.toString() === nodeId.toString();
      const isDescendant = newNode.ancestors.some(
        ancestorId => ancestorId.toString() === userNodeId.toString()
      );

      if (!isOwnNode && !isDescendant) {
        return res.status(403).json({ message: 'Cannot move user to inaccessible node' });
      }

      user.nodeId = nodeId;
    }

    if (name) user.name = name;
    if (lastName) user.lastName = lastName;
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      user.username = username;
    }
    if (role) user.role = role;

    await user.save();
    await user.populate('nodeId');

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:userId', authenticate, authorize('manager'), canManageUser, async (req, res, next) => {
  try {
    const user = req.targetUser;

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;