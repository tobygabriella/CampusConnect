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

### Environment Configuration

Both the backend and frontend require their own environment variables.

1. **Backend Configuration**

   Copy the example environment file and update with your values:

   ```bash
   cd backend
   cp .env.example .env
   ```

   Key variables to configure:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret for JWT token generation
   - `STRIPE_SECRET_KEY`: Stripe API secret key
   - `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: AWS credentials

2. **Frontend Configuration**

   ```bash
   cd frontend
   cp .env.example .env
   ```

   Key variables to configure:
   - `VITE_API_URL`: Backend API URL
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

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

## License

This project is proprietary and confidential.
