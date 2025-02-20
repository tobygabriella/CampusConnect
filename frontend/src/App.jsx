import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./Components/Auth/Loginpage.jsx";
import SignupPage from "./Components/Auth/SignupPage.jsx";
import OnboardingPage from "./Components/Onboarding/OnboardingPage.jsx";
import ServiceProviderDetails from "./Components/Onboarding/ServiceProviderDetails.jsx";
import ProtectedRoute from "./Components/Auth/ProtectedRoute.jsx";
import { AuthProvider } from "./Components/context/AuthContext.jsx";
import RedirectIfAuthenticated from "./Components/Auth/RedirectIfAuthenticated.jsx";
import ProfilePage from "./Components/ProfilePage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
        <Route path="/" element={<RedirectIfAuthenticated />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

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


