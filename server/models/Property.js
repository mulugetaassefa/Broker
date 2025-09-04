const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  propertyType: {
    type: String,
    enum: ['house', 'apartment', 'land', 'commercial', 'office', 'warehouse', 'other'],
    required: true
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
      default: false
    }
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
  size: {
    value: {
      type: Number,
      required: [true, 'Size is required'],
      min: [0, 'Size cannot be negative']
    },
    unit: {
      type: String,
      enum: ['sqm', 'sqft', 'hectares', 'acres'],
      default: 'sqm'
    }
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
  images: [{
    url: String,
    publicId: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  features: [{
    type: String,
    trim: true
  }],
  contactInfo: {
    name: String,
    email: String,
    phone: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
propertySchema.index({ user: 1, status: 1 });
propertySchema.index({ 'location.city': 1, 'location.subCity': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ status: 1 });

// Virtual for getting user info
propertySchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
  select: 'firstName lastName email phone'
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
