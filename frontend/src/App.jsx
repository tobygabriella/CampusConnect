import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import LoginPage from "./Components/Auth/Loginpage.jsx";
import SignupPage from "./Components/Auth/SignupPage.jsx";
import OnboardingPage from "./Components/Onboarding/OnboardingPage.jsx";
import ServiceProviderDetails from "./Components/Onboarding/ServiceProviderDetails.jsx";
import ProtectedRoute from "./Components/Auth/ProtectedRoute.jsx";
import { AuthProvider } from "./Components/context/AuthContext.jsx";
import RedirectIfAuthenticated from "./Components/Auth/RedirectIfAuthenticated.jsx";
import ProfilePage from "./Components/Profile/ProfilePage.jsx";
import LandingPage from "./Components/LandingPage/LandingPage.jsx";
import BookingPage from "./Components/Appointment/BookingPage.jsx";
import AppointmentsPage from "./Components/Appointment/AppointmentsPage.jsx";
import EditProfilePage from "./Components/Profile/EditProfilePage.jsx";
import CheckoutPage from "./Components/Appointment/CheckoutPage.jsx";
import CommunityPage from "./Components/Forum/CommunityPage.jsx";
import PostDetailPage from "./Components/Forum/PostDetailPage.jsx";
import CreatePostModal from "./Components/Forum/CreatePostModal.jsx";
import CommentThreadPage from "./Components/Forum/CommentThreadPage.jsx";
import HomeFeedPage from "./Components/WorkPost/HomeFeedPage.jsx";
import NotificationsPage from "./Components/Notification/NotificationPage.jsx";
import NotAuthorized from "./Components/Auth/NotAuthorized.jsx";
import WaitlistPage from "./Components/Waitlist/WaitlistPage.jsx";
import CreatePostPage from "./Components/WorkPost/CreatePostPage.jsx";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
        <Route path = "/" element = {<LandingPage/>} />
        <Route path="/getting-started" element={<RedirectIfAuthenticated />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/waitlist" element={<WaitlistPage />} />
        <Route path="/not-authorized" element={<NotAuthorized />} />
        <Route element={<ProtectedRoute requiresOnboarding={true} />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
        <Route 
          element={
            <ProtectedRoute 
              requiresAuth={true} 
              allowedRoles={["student", "service_provider"]} 
            />
          }
        >
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/book/:username" element={<BookingPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/community/posts/:postId" element={<PostDetailPage />} />
          <Route path="/create-post" element={<CreatePostModal />} />
          <Route path="/comments/:commentId/thread" element={<CommentThreadPage />} />
          {/* Removed CreateWorkPost route as it should only be used as a modal */}
          <Route path="/home" element={<HomeFeedPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/checkout" element={
              <Elements stripe={stripePromise}>
                <CheckoutPage />
              </Elements>} 
          />
        </Route>
        
        {/* Student-only routes */}
        <Route
          element={
            <ProtectedRoute
              requiresAuth={true}
              allowedRoles={["student"]}
            />
          }
        >
          <Route path="/community" element={<CommunityPage />} />
        </Route>

        {/* Service provider-only route */}
          <Route 
            element={
              <ProtectedRoute 
                requiresAuth={true} 
                allowedRoles={["service_provider"]} 
              />
            }
          >
            <Route path="/service-provider-info" element={<ServiceProviderDetails />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;