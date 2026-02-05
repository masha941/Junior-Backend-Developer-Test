const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['office', 'store'], 
    required: true 
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Node',
    default: null 
  },
  ancestors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node'
  }]
}, { timestamps: true });

nodeSchema.index({ parentId: 1 });
nodeSchema.index({ ancestors: 1 });

nodeSchema.statics.getDescendantIds = async function(nodeId) {
  const descendants = await this.find({ ancestors: nodeId }).select('_id');
  return descendants.map(d => d._id);
};

nodeSchema.statics.getNodeWithDescendantIds = async function(nodeId) {
  const descendantIds = await this.getDescendantIds(nodeId);
  return [nodeId, ...descendantIds];
};

module.exports = mongoose.model('Node', nodeSchema);