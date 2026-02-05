const express = require('express');
const Node = require('../models/Node');
const { authenticate, authorize, canAccessNode } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const userNodeId = req.user.nodeId._id || req.user.nodeId;
    const accessibleNodeIds = await Node.getNodeWithDescendantIds(userNodeId);
    
    const nodes = await Node.find({ _id: { $in: accessibleNodeIds } })
      .populate('parentId', 'name type');

    res.json({ nodes, count: nodes.length });
  } catch (error) {
    next(error);
  }
});

router.get('/:nodeId', authenticate, canAccessNode, async (req, res, next) => {
  try {
    const node = await Node.findById(req.params.nodeId)
      .populate('parentId', 'name type')
      .populate('ancestors', 'name type');

    res.json({ node });
  } catch (error) {
    next(error);
  }
});

router.get('/:nodeId/descendants', authenticate, canAccessNode, async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    
    const descendants = await Node.find({ ancestors: nodeId })
      .populate('parentId', 'name type');

    res.json({ descendants, count: descendants.length });
  } catch (error) {
    next(error);
  }
});

router.get('/:nodeId/children', authenticate, canAccessNode, async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    
    const children = await Node.find({ parentId: nodeId })
      .populate('parentId', 'name type');

    res.json({ children, count: children.length });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const { name, type, parentId } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    if (!['office', 'store'].includes(type)) {
      return res.status(400).json({ message: 'Type must be office or store' });
    }

    let ancestors = [];
    if (parentId) {
      const userNodeId = req.user.nodeId._id || req.user.nodeId;
      const parentNode = await Node.findById(parentId);
      
      if (!parentNode) {
        return res.status(404).json({ message: 'Parent node not found' });
      }

      const isOwnNode = userNodeId.toString() === parentId.toString();
      const isDescendant = parentNode.ancestors.some(
        ancestorId => ancestorId.toString() === userNodeId.toString()
      );
      const isUserNode = userNodeId.toString() === parentId.toString();

      if (!isOwnNode && !isDescendant && !isUserNode) {
        return res.status(403).json({ message: 'Cannot create node under inaccessible parent' });
      }

      ancestors = [...parentNode.ancestors, parentId];
    }

    const node = new Node({
      name,
      type,
      parentId: parentId || null,
      ancestors
    });

    await node.save();
    await node.populate('parentId', 'name type');

    res.status(201).json({ message: 'Node created successfully', node });
  } catch (error) {
    next(error);
  }
});

router.put('/:nodeId', authenticate, authorize('manager'), canAccessNode, async (req, res, next) => {
  try {
    const { name, type } = req.body;
    const node = req.targetNode;

    if (name) node.name = name;
    if (type) {
      if (!['office', 'store'].includes(type)) {
        return res.status(400).json({ message: 'Type must be office or store' });
      }
      node.type = type;
    }

    await node.save();
    await node.populate('parentId', 'name type');

    res.json({ message: 'Node updated successfully', node });
  } catch (error) {
    next(error);
  }
});

router.delete('/:nodeId', authenticate, authorize('manager'), canAccessNode, async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const node = req.targetNode;

    const userNodeId = req.user.nodeId._id || req.user.nodeId;
    if (userNodeId.toString() === nodeId.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own node' });
    }

    const hasChildren = await Node.exists({ parentId: nodeId });
    if (hasChildren) {
      return res.status(400).json({ message: 'Cannot delete node with children. Delete children first.' });
    }

    const User = require('../models/User');
    const hasUsers = await User.exists({ nodeId });
    if (hasUsers) {
      return res.status(400).json({ message: 'Cannot delete node with assigned users. Reassign users first.' });
    }

    await Node.findByIdAndDelete(nodeId);

    res.json({ message: 'Node deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;