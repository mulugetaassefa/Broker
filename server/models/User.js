const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^(\+251|0)?[79]\d{8}$/, 'Please enter a valid Ethiopian phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  userType: {
    type: String,
    enum: ['seller', 'buyer', 'lessor', 'lessee'],
    required: [true, 'User type is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  address: {
    region: {
      type: String,
      enum: ['Addis Ababa', 'Amhara', 'Oromia', 'Tigray', 'SNNP', 'Somali', 'Afar', 'Dire Dawa', 'Harari', 'Benishangul-Gumuz', 'Gambela', 'Sidama'],
      required: false
    },
    subCity: {
      type: String,
      enum: ['Bole', 'Gulele', 'Yeka', 'Addis Ketema', 'Akaki Kaliti', 'Arada', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto'],
      required: false
    },
    specificLocation: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters']
    }
  },
  identityDocuments: {
    nationalId: {
      number: String,
      document: String, // URL to the uploaded document
      verified: {
        type: Boolean,
        default: false
      }
    },
    passport: {
      number: String,
      document: String, // URL to the uploaded document
      expiryDate: Date,
      verified: {
        type: Boolean,
        default: false
      }
    },
    otherDocuments: [{
      name: String,
      document: String, // URL to the uploaded document
      verified: {
        type: Boolean,
        default: false
      }
    }]
  },
  profilePicture: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);