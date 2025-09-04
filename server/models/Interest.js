const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  path: { type: String, required: true },
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const priceRangeSchema = new mongoose.Schema({
  min: { type: Number, required: true, min: 0 },
  max: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'ETB' }
});

const interestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['house', 'car', 'other']
    },
    transactionType: {
      type: String,
      required: true,
      enum: ['buy', 'sell', 'rent', 'lease']
    },
    priceRange: {
      type: priceRangeSchema,
      required: true,
      validate: {
        validator: function(v) {
          return v.max >= v.min;
        },
        message: 'Max price must be greater than or equal to min price'
      }
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      maxlength: 1000,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      maxlength: 1000
    },
    images: [imageSchema],
    details: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    // Type-specific fields
    houseDetails: {
      numRooms: { type: Number, min: 0 },
      numBathrooms: { type: Number, min: 0, default: 1 },
      hasParking: { type: Boolean, default: false },
      hasGarden: { type: Boolean, default: false },
      area: { type: Number, min: 0 } // in square meters
    },
    carDetails: {
      model: String,
      year: { type: Number, min: 1900, max: new Date().getFullYear() + 1 },
      mileage: { type: Number, min: 0 },
      transmission: { type: String, enum: ['automatic', 'manual'] },
      fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid', 'other'] }
    },
    otherDetails: {
      itemType: String,
      condition: { type: String, enum: ['new', 'used', 'refurbished'] },
      description: { type: String, maxlength: 1000 }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for faster querying
interestSchema.index({ user: 1, status: 1 });
interestSchema.index({ type: 1, status: 1 });
interestSchema.index({ createdAt: -1 });

// Virtual for getting formatted created date
interestSchema.virtual('createdAtFormatted').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Pre-save hook to validate price range
interestSchema.pre('save', function(next) {
  if (this.priceRange.min > this.priceRange.max) {
    throw new Error('Minimum price cannot be greater than maximum price');
  }
  next();
});

// Pre-remove hook to delete associated images
interestSchema.pre('remove', async function(next) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Delete all associated images
    await Promise.all(this.images.map(async (image) => {
      const filePath = path.join(__dirname, '..', image.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }));
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Interest', interestSchema);
