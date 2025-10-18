# Aro

Aro is a platform connecting college students with service providers for beauty and grooming services. The application facilitates booking appointments, community discussions, and social interactions within college communities.

## Project Overview

Aro is a full-stack web application with the following key features:

- **User Authentication**: Email/password and Google OAuth login with role-based access
- **Service Provider Features**: Profile management, service listings, availability management
- **Booking System**: Appointment scheduling, reminders, and confirmations
- **Payment Processing**: Secure payments via Stripe integration
- **Community Forum**: Discussion boards for college communities
- **Social Features**: Follow users, upvote/downvote posts, comments
- **Real-time Notifications**: Instant updates for appointments, social interactions

## Tech Stack

### Backend

- Node.js with Express.js
- PostgreSQL database with Prisma ORM
- Socket.IO for real-time features
- AWS S3 for file storage
- Stripe for payment processing

### Frontend

- React with Vite
- Tailwind CSS and Shadcn UI components
- React Router for navigation
- Stripe Elements for payment UI

## Project Structure

```text
/
├── backend/           # Express.js backend API
│   ├── cronJobs/      # Scheduled tasks
│   ├── enums/         # Enum definitions
│   ├── middleware/    # Express middleware
│   ├── prisma/        # Database schema and migrations
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic services
│   └── utils/         # Helper utilities
│
└── frontend/          # React frontend application
    ├── public/        # Static assets
    └── src/           # Source code
        ├── Components/  # React components
        ├── assets/      # Images and other assets
        ├── hooks/       # Custom React hooks
        ├── lib/         # Utility libraries
        └── utils/       # Helper functions
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database

### Environment Configuration and Feature Flags

Both the backend and frontend use environment variables for configuration and feature flags.

#### 1. Backend Configuration

Copy the example environment file and update with your values:

```bash
cd backend
cp .env.example .env
```

##### Core Configuration

- `PORT`: Server port number (default: 5001)
- `NODE_ENV`: Environment (development/production/test)
- `DATABASE_URL`: PostgreSQL connection string
- `FRONTEND_URL`: URL for the frontend application (CORS)

##### Authentication & Security

- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRATION`: Token expiration time (e.g., "24h")
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `JWT_REFRESH_EXPIRATION`: Refresh token expiration
- `SESSION_SECRET`: Session cookie secret
- `BCRYPT_SALT_ROUNDS`: Password hashing strength (10-12 recommended)

##### External Services

- `STRIPE_SECRET_KEY`: Stripe API secret key for payments
- `STRIPE_WEBHOOK_SECRET`: Secret for Stripe webhook validation
- `AWS_S3_BUCKET_NAME`: S3 bucket for file uploads
- `AWS_REGION`: AWS region for S3 bucket
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

##### Email Configuration

- `EMAIL_SERVICE`: Email provider (e.g., "Gmail", "SendGrid")
- `EMAIL_USER`: Sender email address
- `EMAIL_PASSWORD`: Email account password or API key

##### Feature Flags

- `ENABLE_SOCIAL_FEATURES`: Enable/disable social interaction features (true/false)
- `ENABLE_EMAIL_NOTIFICATIONS`: Enable/disable email notifications (true/false)
- `ENABLE_SMS_NOTIFICATIONS`: Enable/disable SMS notifications (true/false)
- `ENABLE_GOOGLE_AUTH`: Enable/disable Google OAuth login (true/false)
- `MAINTENANCE_MODE`: Put application in maintenance mode (true/false)

#### 2. Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

##### Core Configuration2

- `VITE_API_URL`: URL for the backend API
- `VITE_API_TIMEOUT`: API request timeout in milliseconds
- `VITE_SOCKET_URL`: URL for real-time socket connection

##### Third-party Integration Keys

- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for payment UI
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `VITE_ANALYTICS_ID`: Web analytics ID (if used)

##### Feature Flags2

- `VITE_ENABLE_MOCK_API`: Use mock API data for development (true/false)
- `VITE_ENABLE_ANALYTICS`: Enable usage analytics tracking (true/false)
- `VITE_ENABLE_SOCIAL_FEATURES`: Enable social interaction features (true/false)
- `VITE_ENABLE_NOTIFICATIONS`: Enable in-app notifications (true/false)

##### UI Configuration

- `VITE_DEFAULT_THEME`: Default theme (light/dark)
- `VITE_ENABLE_ANIMATIONS`: Enable UI animations (true/false)
- `VITE_DEBUG_UI`: Show UI debug information in development (true/false)

### Running the Application

#### Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push  # Sets up the database schema
npm run dev         # Starts development server
```

The backend will run on [http://localhost:5001](http://localhost:5001) by default.

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on [http://localhost:5173](http://localhost:5173) by default.

## Running Frontend Without Backend

While the frontend is designed to work with the backend API, you can run it independently for UI development by:

1. Creating mock data services
2. Using hardcoded data instead of API calls
3. Using a tool like MSW (Mock Service Worker) to intercept API requests

However, full functionality (authentication, data persistence, real-time features) requires the backend to be running.

## Development Workflow

1. Clone the repository
2. Set up environment variables
3. Install dependencies for both frontend and backend
4. Start both servers in development mode
5. Make changes and see them reflected in real-time

## Recent Updates

### Frontend Enhancements

1. **Landing Page Redesign**:
   - Modern parallax scrolling effects
   - Improved responsive design
   - Feature showcase sections
   - Step-by-step service explanation

2. **Authentication Flow**:
   - Streamlined login and signup processes
   - Improved navigation between auth pages
   - Consistent styling and animations

3. **Legal Documentation**:
   - Added Privacy Policy page
   - Added Terms & Conditions page
   - Accessible through footer links

### Backend Integration Guide

To integrate new frontend features with the backend:

#### 1. API Client Setup

```javascript
// /frontend/src/utils/axiosInstance.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const instance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
```

#### 2. API Service Pattern

Organize API calls into service modules:

```javascript
// /frontend/src/services/searchService.js
import api from '../utils/axiosInstance';

export const searchProviders = async ({ query, filters = {} }) => {
  try {
    const response = await api.get('/search', { 
      params: { 
        query,
        filter: filters.providerType || 'all',
        styles: filters.styles,
        lat: filters.latitude,
        lng: filters.longitude,
        radius: filters.radius 
      } 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

#### 3. React Query Integration

Use React Query to manage server state:

```jsx
import { useQuery } from 'react-query';
import { searchProviders } from '../services/searchService';

const useProviderSearch = (searchParams) => {
  return useQuery(
    ['providers', searchParams],
    () => searchProviders(searchParams),
    { enabled: !!searchParams.query }
  );
};
```

## Managing Feature Flags

Aro uses a comprehensive feature flag system to enable controlled feature releases and A/B testing. These flags can be configured at both the backend and frontend levels.

### Types of Feature Flags

1. **Environment Flags**: Set through environment variables (`.env` files)
2. **Dynamic Flags**: Managed through the admin interface or database
3. **User-specific Flags**: Features enabled for specific user roles or accounts
4. **Development Flags**: Features only active in development environments

### Adding New Feature Flags

#### Backend Feature Flags

1. Add the flag to the `.env.example` file with documentation
2. Add the flag to the environment variable validation schema in `/backend/config/env.js`
3. Access the flag in your code using `process.env.FLAG_NAME`

```javascript
// Example in backend/config/env.js
module.exports = {
  // ... other validations
  ENABLE_NEW_FEATURE: Joi.boolean().default(false),
};

// Usage in a controller or service
if (process.env.ENABLE_NEW_FEATURE === 'true') {
  // Feature-specific code
}
```

#### Frontend Feature Flags

1. Add the flag to the `.env.example` file with documentation
2. Access the flag in components using `import.meta.env.VITE_FLAG_NAME`

```jsx
// Example in a React component
const MyComponent = () => {
  const isFeatureEnabled = import.meta.env.VITE_ENABLE_NEW_FEATURE === 'true';
  
  return (
    <div>
      {isFeatureEnabled && <NewFeatureComponent />}
    </div>
  );
};
```

### Testing with Feature Flags

To test features behind flags:

1. Create a separate `.env.local` file (gitignored) with the flag enabled
2. Use environment-specific test setups in test files
3. Mock the environment variables in unit tests

```javascript
// Example test with mocked feature flag
before(() => {
  process.env.ENABLE_NEW_FEATURE = 'true';
});

after(() => {
  delete process.env.ENABLE_NEW_FEATURE;
});
```

### Feature Flag Best Practices

1. **Default to Off**: New feature flags should default to `false` for safety
2. **Clear Documentation**: Document the purpose and expected behavior of each flag
3. **Clean Up**: Remove flags once features are fully deployed and stable
4. **Avoid Dependencies**: Don't make feature flags dependent on other flags
5. **Consistent Naming**: Follow the `ENABLE_FEATURE_NAME` convention

## License

This project is proprietary and confidential.
