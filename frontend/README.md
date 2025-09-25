# Aro Frontend

This is the frontend application for Aro, a comprehensive platform connecting college students with service providers for beauty, grooming, and wellness services. The application enables seamless booking, community interaction, and personalized service discovery within college communities.

## Features

### Authentication & User Management

- **Multi-role User System**: Support for students, service providers, and administrators
- **Email/Password Authentication**: Secure login with email verification
- **OAuth Integration**: Simple sign-up and login via Google
- **Profile Management**: Customizable user profiles with profile pictures and preferences
- **Role-based Access Control**: Different views and permissions based on user roles

### Service Provider Platform

- **Service Provider Profiles**: Detailed profiles with portfolios, service listings, and reviews
- **Service Management**: Add, edit, and remove service offerings with pricing and duration
- **Availability Calendar**: Set working hours and manage availability
- **Portfolio Showcase**: Upload and display work samples and client transformations

### Booking System

- **Interactive Booking**: User-friendly interface for selecting services, dates, and times
- **Availability Checking**: Real-time availability verification
- **Appointment Management**: View, reschedule, or cancel upcoming appointments
- **Reminder System**: Email and in-app notifications for upcoming appointments

### Community Forum

- **College-specific Forums**: Discussions organized by college community
- **Post Creation**: Rich text posts with image attachments
- **Categorization**: Tags and topics for organized discussions
- **Social Interactions**: Comments, upvotes, and downvotes

### Social Features

- **Follow System**: Follow service providers and other users
- **Activity Feed**: Personalized feed showing posts from followed users
- **Notification Center**: Alerts for mentions, comments, and interactions

### Payment Processing

- **Secure Payments**: Integration with Stripe for payment processing
- **Deposit System**: Optional deposits for service booking
- **Payment History**: Track past payments and upcoming charges

### Real-time Features

- **Live Notifications**: Instant updates for social interactions
- **Appointment Updates**: Real-time status changes for bookings
- **Message Indicators**: Notification badges and counters

## Tech Stack

### Core Framework

- **React 18**: Modern UI library for building component-based interfaces
- **Vite**: Next-generation frontend tooling for faster development and optimized builds
- **TypeScript**: Type safety for improved developer experience and code quality

### Routing & State Management

- **React Router v6**: Declarative routing with nested routes and route-based code splitting
- **React Context API**: State management for authentication, theming, and global UI state
- **React Query**: Data fetching, caching, and synchronization with automatic refetching

### UI Components & Styling

- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Shadcn UI**: High-quality, accessible, and customizable component library
- **Framer Motion**: Animation library for creating fluid motion interfaces
- **Lucide Icons**: Consistent, customizable icon set

### Form Handling

- **React Hook Form**: Performant form validation with minimal re-renders
- **Zod**: Schema validation library for type-safe form handling

### API Communication

- **Axios**: Promise-based HTTP client for API requests
- **Socket.IO Client**: Real-time bidirectional event-based communication

### Payment Processing1

- **Stripe Elements**: Pre-built UI components for secure payment forms
- **Stripe.js**: Client-side library for secure payment handling

### Development & Testing

- **ESLint**: Static code analysis for identifying problematic patterns
- **Prettier**: Code formatter for consistent code style
- **Vitest**: Unit testing framework compatible with Vite

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running (optional for development with mock data)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Configuration

Create a `.env` file in the root of the frontend directory using the provided `.env.example` as a template:

```bash
cp .env.example .env
```

Update the values in the `.env` file with your specific configuration:

```env
VITE_API_URL=http://localhost:5001  # URL to your backend API
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key  # Your Stripe publishable key
```

### 3. Running the Application

#### Development Mode

```bash
npm run dev
# or
yarn dev
```

This will start the development server at [http://localhost:5173](http://localhost:5173)

#### Production Build

```bash
npm run build
# or
yarn build
```

To preview the production build:

```bash
npm run preview
# or
yarn preview
```

## Running Without Backend

The frontend application is designed to work with the Aro backend API. However, for development and UI work, you can:

1. Use mock data by creating mock service files
2. Comment out API calls and use hardcoded data
3. Use a tool like MSW (Mock Service Worker) to intercept API requests

Note that full functionality (authentication, data persistence, real-time features) requires the backend to be running.

## Recent UI Enhancements

### Landing Page Updates

The landing page has been completely redesigned with a modern, parallax-based interface that includes:

- Smooth animations using Framer Motion
- Mobile-responsive design
- Clear navigation with hover effects
- Feature showcase section
- Step-by-step explanation of the service
- Updated styling with proper CSS structure

### Auth Flow Integration

Improved the authentication flow to connect with backend services:

- Login and signup buttons now properly navigate to their respective pages
- Clean transitions between authentication steps
- Consistent styling across authentication components

### Policy Pages

Added legal documentation pages with a clean, professional design:

- Privacy Policy page (`/privacy`)
- Terms & Conditions page (`/terms`)
- Both accessible via the footer links
- Responsive layout with animations

### Contact Information

Added contact email ([info@aro.com](mailto:info@aro.com)) in the footer for user inquiries.

## Frontend-Backend Integration

### API Integration

The frontend interfaces with the backend through a set of RESTful API endpoints. Here's how to integrate with key backend services:

#### Authentication Flow

1. **Login/Signup**: The frontend makes POST requests to `/api/auth/login` and `/api/auth/signup` endpoints
2. **Token Management**: JWT tokens are stored in local storage and included in the Authorization header
3. **Protected Routes**: The `ProtectedRoute` component handles redirect logic for unauthenticated users

#### Service Provider Search

1. **Search API**: Use the `/api/search` endpoint with query parameters:
   - `query`: The search term
   - `filter`: Optional filter ("users", "service_providers", "services", or "all")
2. **Filtering Results**: Filter results client-side based on the returned data

#### Service Provider Profile

1. **Fetch Provider**: Get provider details via `/api/serviceProvider/details`
2. **Update Profile**: Post updates to `/api/serviceProvider/details`
3. **Services Management**: Services are created/updated as part of the provider profile

#### Appointment Booking

1. **Availability Check**: Query `/api/availability` with provider ID and date range
2. **Book Appointment**: POST to `/api/appointments` with service, provider, and time details
3. **Payment Processing**: Integrate with Stripe via `/api/payments`

### Upcoming Features Integration

#### Location Radius Search

To implement location-based searching with radius filtering:

1. **Backend Requirements:**
   - Extend the `ServiceProvider` model to include geolocation data (latitude/longitude)
   - Add geocoding functionality to convert addresses to coordinates
   - Implement a spatial query endpoint at `/api/search/nearby` that accepts:
     - `lat` and `lng` parameters for the center point
     - `radius` parameter (in miles or kilometers)

2. **Frontend Implementation:**
   - Add Google Places Autocomplete for location selection
   - Implement a radius slider in the search filters component
   - Pass coordinates and radius to the search API
   - Display results on a map view using coordinates returned from the API

#### Service Style Filtering

To implement style-based filtering for beauty services:

1. **Backend Requirements:**
   - Extend the `Service` model to include a `styleTypes` array field
   - Create a `StyleType` enum or reference table for consistent categorization
   - Update the search API to accept a `styles` parameter for filtering

2. **Frontend Implementation:**
   - Add style chips/filters to the search interface
   - Implement multi-select functionality for choosing multiple styles
   - Pass selected styles as an array parameter to search queries
   - Display style tags on service provider cards in search results

## Folder Structure

```bash
/frontend
├── public/                  # Static assets served as-is
│   ├── favicon.ico         # Site favicon
│   └── images/             # Static images
├── src/
│   ├── Components/         # React components organized by feature
│   │   ├── Appointment/    # Appointment-related components
│   │   ├── Auth/           # Authentication components
│   │   ├── Forum/          # Community forum components
│   │   ├── LandingPage/    # Landing page components
│   │   ├── Navigation/     # Navigation and layout components
│   │   ├── Notification/   # Notification components
│   │   ├── Onboarding/     # User onboarding flows
│   │   ├── Payment/        # Payment-related components
│   │   ├── Profile/        # User profile components
│   │   ├── UI/             # Shared UI components
│   │   └── WorkPost/       # Content post components
│   ├── assets/             # Assets imported into components
│   │   ├── icons/          # SVG icons
│   │   └── images/         # Images used in components
│   ├── context/            # React context providers
│   │   ├── AuthContext.jsx # Authentication context
│   │   └── UIContext.jsx   # UI state context
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.js      # Authentication hook
│   │   ├── useSocket.js    # Socket.IO connection hook
│   │   └── useForm.js      # Form handling hook
│   ├── lib/                # Third-party library setups
│   │   ├── axios.js        # Axios instance configuration
│   │   └── stripe.js       # Stripe initialization
│   ├── styles/             # Global styles and theme
│   │   └── aro-ui-styles.css # Custom UI styles
│   ├── utils/              # Utility functions
│   │   ├── formatters.js   # Data formatting utilities
│   │   ├── validators.js   # Data validation functions
│   │   └── axiosInstance.js # API client configuration
│   ├── App.jsx             # Root application component
│   └── main.jsx            # Application entry point
├── .env.example            # Example environment variables
├── .eslintrc.js            # ESLint configuration
├── index.html              # HTML template
├── package.json            # Project dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.js          # Vite build configuration
```

## Feature Flags and Configuration

### Environment Variables

The application uses several environment variables to control its behavior. Create a `.env` file in the root directory with the following options:

```bash
# API Configuration
VITE_API_URL=http://localhost:5001    # Backend API URL
VITE_API_TIMEOUT=30000                # API request timeout in milliseconds

# Feature Flags
VITE_ENABLE_MOCK_API=false           # Enable mock API responses
VITE_ENABLE_ANALYTICS=false           # Enable analytics tracking
VITE_ENABLE_SOCIAL_FEATURES=true      # Enable social interaction features

# Third-party Integration Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_  # Stripe publishable key
VITE_GOOGLE_CLIENT_ID=                # Google OAuth client ID

# UI Configuration
VITE_DEFAULT_THEME=light              # Default theme (light/dark)
VITE_ENABLE_ANIMATIONS=true           # Enable UI animations
```

### Feature Toggle System

The application includes a feature toggle system that allows enabling or disabling features without code changes:

- **Development Features**: Toggle features during development using `import.meta.env.DEV`
- **Environment-Based Features**: Enable features based on environment variables
- **Role-Based Features**: Show features based on user roles

Example usage:

```jsx
// Feature based on environment variable
{import.meta.env.VITE_ENABLE_SOCIAL_FEATURES === 'true' && (
  <SocialFeatures />
)}

// Development-only features
{import.meta.env.DEV && <DevToolbar />}

// Role-based feature access
{user?.role === 'service_provider' && <ServiceManagement />}
```
