const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const { getIO } = require('../socket');

// @desc    Send a message to admin
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { content, attachments = [] } = req.body;
    const senderId = req.user.id;

    // Find an admin user (you might want to modify this based on your admin role logic)
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const conversationId = await Message.getConversationId(senderId, admin._id);

    const message = new Message({
      sender: senderId,
      receiver: admin._id,
      content,
      conversationId,
      isAdminReply: false,
      attachments
    });

    await message.save();

    // Populate sender details for the response
    await message.populate('sender', 'firstName lastName email');

    // Emit new message event
    const io = getIO();
    io.to(conversationId).emit('new_message', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all conversations for a user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // If admin, get all unique conversations
    // If regular user, only get their conversation with admin
    let conversations;
    
    if (userRole === 'admin') {
      // For admin, get all unique conversations
      conversations = await Message.aggregate([
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: '$conversationId',
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [{ $eq: ['$isRead', false] }, 1, 0]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastMessage.sender',
            foreignField: '_id',
            as: 'participantInfo'
          }
        },
        {
          $unwind: '$participantInfo'
        },
        {
          $project: {
            _id: 1,
            lastMessage: 1,
            unreadCount: 1,
            participant: {
              _id: '$participantInfo._id',
              firstName: '$participantInfo.firstName',
              lastName: '$participantInfo.lastName',
              email: '$participantInfo.email',
              isAdmin: { $eq: ['$participantInfo.role', 'admin'] }
            }
          }
        },
        {
          $sort: { 'lastMessage.createdAt': -1 }
        }
      ]);
    } else {
      // For regular users, get their conversation with admin
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      const conversationId = await Message.getConversationId(userId, admin._id);
      
      // Get last message in the conversation
      const lastMessage = await Message.findOne({ conversationId })
        .sort({ createdAt: -1 })
        .populate('sender', 'firstName lastName email');

      // Get unread count
      const unreadCount = await Message.countDocuments({
        conversationId,
        isRead: false,
        receiver: userId
      });

      conversations = [{
        _id: conversationId,
        lastMessage,
        unreadCount,
        participant: {
          _id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          isAdmin: true
        }
      }];
    }

    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    console.log('Fetching messages for conversation:', conversationId);
    console.log('Current user ID:', userId, 'Is admin:', isAdmin);

    // For regular users, verify they are part of the conversation
    if (!isAdmin) {
      // Check if the conversation ID includes the user's ID
      if (!conversationId.includes(userId)) {
        console.log('User not authorized for this conversation');
        return res.status(403).json({ message: 'Not authorized to view this conversation' });
      }
    } else {
      console.log('Admin access granted to conversation');
    }

    // Mark messages as read when fetched
    const updateResult = await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        isRead: false
      },
      { $set: { isRead: true } }
    );
    console.log('Marked messages as read:', updateResult);

    // Get all messages for the conversation
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName email');

    console.log('Found messages:', messages.length);
    
    // Return messages (empty array if no messages yet)
    res.json(messages);
      
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get or create a conversation with a user
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // If not admin, users can only talk to admins
    if (!isAdmin) {
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      if (otherUserId !== admin._id.toString()) {
        return res.status(403).json({ message: 'You can only message admins' });
      }
    }

    // Get or create conversation ID
    const conversationId = await Message.getConversationId(currentUserId, otherUserId);
    
    // Check if conversation exists
    const existingMessage = await Message.findOne({ conversationId });
    
    if (!existingMessage) {
      // If no conversation exists yet, create a welcome message
      const welcomeMessage = new Message({
        sender: isAdmin ? currentUserId : otherUserId,
        receiver: isAdmin ? otherUserId : currentUserId,
        content: isAdmin ? 'How can I help you today?' : 'Hello! How can we assist you?',
        conversationId,
        isAdminReply: isAdmin
      });
      
      await welcomeMessage.save();
      await welcomeMessage.populate('sender', 'firstName lastName email');
      
      // Return the new conversation with the welcome message
      return res.json([welcomeMessage]);
    }
    
    // If conversation exists, return all messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName email');
      
    res.json(messages);
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Admin replies to a user
// @route   POST /api/messages/admin/reply
// @access  Private/Admin
exports.adminReply = async (req, res) => {
  try {
    const { content, conversationId, receiverId, attachments = [] } = req.body;
    const senderId = req.user.id;

    // Verify the admin is part of this conversation
    const existingMessage = await Message.findOne({ conversationId });
    if (!existingMessage) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      conversationId,
      isAdminReply: true,
      attachments
    });

    await message.save();
    await message.populate('sender', 'firstName lastName email');

    // Emit new message event
    const io = getIO();
    io.to(conversationId).emit('new_message', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending admin reply:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
