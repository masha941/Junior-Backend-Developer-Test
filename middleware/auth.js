const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const Node = require('../models/Node');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    
    const user = await User.findById(decoded.userId).populate('nodeId');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

const canAccessNode = async (req, res, next) => {
  try {
    const targetNodeId = req.params.nodeId || req.body.nodeId;
    if (!targetNodeId) {
      return next();
    }

    const userNodeId = req.user.nodeId._id || req.user.nodeId;
    const targetNode = await Node.findById(targetNodeId);
    
    if (!targetNode) {
      return res.status(404).json({ message: 'Node not found' });
    }

    const isOwnNode = userNodeId.toString() === targetNodeId.toString();
    const isDescendant = targetNode.ancestors.some(
      ancestorId => ancestorId.toString() === userNodeId.toString()
    );

    if (!isOwnNode && !isDescendant) {
      return res.status(403).json({ message: 'Access denied to this node' });
    }

    req.targetNode = targetNode;
    next();
  } catch (error) {
    next(error);
  }
};

const canManageUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    if (!targetUserId) {
      return next();
    }

    const targetUser = await User.findById(targetUserId).populate('nodeId');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can manage users' });
    }

    const userNodeId = req.user.nodeId._id || req.user.nodeId;
    const targetNodeId = targetUser.nodeId._id || targetUser.nodeId;
    
    const isOwnNode = userNodeId.toString() === targetNodeId.toString();
    const targetNodeDoc = await Node.findById(targetNodeId);
    const isDescendant = targetNodeDoc && targetNodeDoc.ancestors.some(
      ancestorId => ancestorId.toString() === userNodeId.toString()
    );

    if (!isOwnNode && !isDescendant) {
      return res.status(403).json({ message: 'Access denied to manage this user' });
    }

    req.targetUser = targetUser;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  canAccessNode,
  canManageUser
};