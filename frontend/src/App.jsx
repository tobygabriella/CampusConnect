import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./Components/Auth/Loginpage.jsx";
import SignupPage from "./Components/Auth/SignupPage.jsx";
import OnboardingPage from "./Components/Onboarding/OnboardingPage.jsx";
import HomePage from "./Components/HomePage.jsx";
import ServiceProviderInfo from "./Components/ServiceProviderInfo.jsx";
import ProtectedRoute from "./Components/Auth/ProtectedRoute.jsx";
import { AuthProvider } from "./Components/context/AuthContext.jsx";
import RedirectIfAuthenticated from "./Components/Auth/RedirectIfAuthenticated.jsx";

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
                allowedRoles={["student"]} 
              />
            }
          >
            <Route path="/home" element={<HomePage />} />
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
            <Route path="/service-provider-info" element={<ServiceProviderInfo />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


