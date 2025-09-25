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

### Payment Processing
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

## Folder Structure

```
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

```
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
