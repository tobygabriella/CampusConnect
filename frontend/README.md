# Aro Frontend

This is the frontend application for Aro, a platform connecting college students with service providers for beauty and grooming services.

## Features

- User authentication (login/signup)
- Service provider profiles and booking
- Community forum for discussions
- Social features (follow users, upvote/downvote posts)
- Appointment scheduling and management
- Payment processing with Stripe
- Real-time notifications

## Tech Stack

- React with Vite
- React Router for navigation
- Tailwind CSS for styling
- Shadcn UI components
- Stripe Elements for payment processing
- Socket.IO for real-time features

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

- `/src/Components` - React components organized by feature
- `/src/assets` - Static assets like images
- `/src/hooks` - Custom React hooks
- `/src/lib` - Utility libraries and configurations
- `/src/utils` - Helper functions and utilities
