const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestType: {
    type: String,
    enum: ['buy', 'sell', 'lease', 'rent'],
    required: true
  },
  propertyType: {
    type: String,
    enum: ['house', 'apartment', 'land', 'commercial', 'office', 'warehouse', 'other'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Request title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  location: {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    subCity: {
      type: String,
      required: [true, 'Sub-city is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    }
  },
  price: {
    amount: {
      type: Number,
      required: [true, 'Price amount is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      enum: ['ETB', 'USD'],
      default: 'ETB'
    },
    negotiable: {
      type: Boolean,
      default: true
    }
  },
  propertyDetails: {
    size: {
      type: Number,
      required: [true, 'Property size is required'],
      min: [0, 'Size cannot be negative']
    },
    unit: {
      type: String,
      enum: ['sqm', 'sqft', 'hectares', 'acres'],
      default: 'sqm'
    },
    bedrooms: {
      type: Number,
      min: [0, 'Bedrooms cannot be negative'],
      default: 0
    },
    bathrooms: {
      type: Number,
      min: [0, 'Bathrooms cannot be negative'],
      default: 0
    },
    parking: {
      type: Boolean,
      default: false
    },
    furnished: {
      type: Boolean,
      default: false
    }
  },
  images: [{
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  contactInfo: {
    preferredContact: {
      type: String,
      enum: ['email', 'phone', 'both'],
      default: 'both'
    },
    availableTime: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
requestSchema.index({ user: 1, status: 1 });
requestSchema.index({ requestType: 1, propertyType: 1 });
requestSchema.index({ 'location.city': 1, 'location.subCity': 1 });
requestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema); 