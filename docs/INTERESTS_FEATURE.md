# Interest Management Feature

This document provides an overview of the interest management feature that allows users to express interest in different types of properties (houses, cars, other items) and enables administrators to manage these interests.

## Features

### For Users
- Submit interest in different types of properties (House, Car, Other)
- View list of their submitted interests
- Edit or delete their interests
- Receive status updates on their interests (Pending, Approved, Rejected)

### For Administrators
- View all user-submitted interests
- Filter and search interests by status, type, and keywords
- Update status of interests (Approve/Reject/Pending)
- View detailed information about each interest submission

## Data Model

The Interest model contains the following fields:

```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['house', 'car', 'other'], required: true },
  // House specific
  priceRange: {
    min: Number,
    max: Number
  },
  numRooms: Number,
  // Car specific
  carModel: String,
  carYear: Number,
  // Other item type
  itemType: String,
  // Common fields
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

## API Endpoints

### User Endpoints
- `POST /api/interests` - Submit a new interest
- `GET /api/interests/me` - Get current user's interests
- `PUT /api/interests/:id` - Update an interest
- `DELETE /api/interests/:id` - Delete an interest

### Admin Endpoints
- `GET /api/interests` - Get all interests (with filters)
- `PUT /api/interests/:id/status` - Update interest status

## Client Components

### User Components
- `InterestForm.jsx` - Form to submit/edit interests
- `MyInterests.jsx` - List of user's interests

### Admin Components
- `AdminInterests.jsx` - Admin interface to manage interests

## Setup and Usage

### Prerequisites
- Node.js
- MongoDB
- React

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.example)
4. Start the development server: `npm run dev`

## Testing

To test the interest management flow:

1. Log in as a regular user
2. Navigate to "My Interests" in the dashboard
3. Click "New Interest" and fill out the form
4. Submit the form
5. Log in as an admin
6. Navigate to "Interests" in the admin panel
7. Review and update the status of the submitted interest

## Security Considerations

- All API endpoints are protected with authentication
- Users can only view and modify their own interests
- Only administrators can view all interests and update statuses
- Input validation is performed on both client and server side

## Future Enhancements

- Email notifications for status updates
- More detailed filtering and sorting options
- Export interests to CSV/Excel
- Bulk actions for administrators
