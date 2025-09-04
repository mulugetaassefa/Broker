const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.isSystemMessage; }
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.isSystemMessage; }
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isAdminReply: {
    type: Boolean,
    default: false
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  conversationId: {
    type: String,
    required: true
  },
  interest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interest'
  },
  attachments: [{
    url: String,
    fileType: String,
    fileName: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster querying
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ isAdminReply: 1, isRead: 1 });
messageSchema.index({ interest: 1 });

// Virtual for message URL
messageSchema.virtual('url').get(function() {
  return `/messages/${this._id}`;
});

// Static method to get or create conversation ID
messageSchema.statics.getConversationId = async function(userId, adminId) {
  if (!userId || !adminId) {
    throw new Error('Both userId and adminId are required');
  }
  const sortedIds = [userId.toString(), adminId.toString()].sort();
  return `conversation_${sortedIds[0]}_${sortedIds[1]}`;
};

// Pre-save hook to ensure conversationId is set
messageSchema.pre('save', async function(next) {
  if (this.isNew && !this.conversationId && this.sender && this.receiver) {
    this.conversationId = await this.constructor.getConversationId(this.sender, this.receiver);
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
