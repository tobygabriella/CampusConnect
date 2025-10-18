import { ArrowRight, Search, MessageSquare, Calendar, Menu, X, Users, Zap, Sparkles, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";
import AroLogo from "@/assets/aro.png";

/**
 * Header Component
 */
const Header = ({ scrolled, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { id: "features", label: "Features", icon: Sparkles },
    { id: "how-it-works", label: "How it works", icon: Zap },
    { id: "contact", label: "Get Started", icon: ArrowRight }
  ];

  return (
    <motion.header 
      className={`landing-header fixed top-0 left-0 right-0 w-full transition-all duration-300 ${scrolled ? "scrolled" : ""}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <motion.div 
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src={AroLogo} alt="Aro Logo" className="h-16" />
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <div 
                key={item.id}
                className="nav-item relative cursor-pointer py-1"
              >
                <div 
                  onClick={() => onNavigate(item.id)}
                  className="flex items-center font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </div>
                <motion.div 
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <div>
              <ModernButton 
                variant="outline" 
                size="sm"
                href="/login"
              >
                Log In
              </ModernButton>
            </div>
            <div>
              <ModernButton 
                variant="primary"
                size="sm"
                icon={<ArrowRight className="h-4 w-4" />}
                iconPosition="right"
                href="/signup"
              >
                Sign Up
              </ModernButton>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button 
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden py-4 mt-2 bg-white rounded-lg shadow-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <nav className="flex flex-col px-4">
                {navItems.map((item) => (
                  <div 
                    key={item.id}
                    className="border-b border-gray-100 relative overflow-hidden"
                  >
                    <motion.div
                      className="flex items-center py-3 text-gray-700 hover:text-blue-600 cursor-pointer"
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      whileHover={{ x: 5 }}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </motion.div>
                  </div>
                ))}
                <div className="pt-2 space-y-2">
                  <div className="w-full">
                    <ModernButton 
                      variant="outline" 
                      className="w-full"
                      href="/login"
                    >
                      Log In
                    </ModernButton>
                  </div>
                  <div className="w-full">
                    <ModernButton 
                      variant="primary"
                      className="w-full"
                      href="/signup"
                    >
                      Sign Up
                    </ModernButton>
                  </div>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

/**
 * Background Shapes Component
 */
const BackgroundShapes = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div 
      className="absolute top-20 left-10 w-24 h-24 bg-blue-200/30 rounded-full blur-xl"
      animate={{ 
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1]
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div 
      className="absolute bottom-40 right-20 w-40 h-40 bg-blue-100/20 rounded-full blur-2xl"
      animate={{ 
        y: [0, 40, 0],
        x: [0, -20, 0],
        scale: [1, 0.9, 1]
      }}
      transition={{ 
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2
      }}
    />
  </div>
);

/**
 * Simplified LandingPage Component
 */
const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef(null);
  
  // Setup parallax scroll effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  // Listen for scroll to change header appearance
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth navigation
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div ref={containerRef} className="landing-container w-screen min-h-screen flex flex-col bg-white">
      <Header scrolled={scrolled} onNavigate={scrollToSection} />
      
      {/* Hero Section with Parallax */}
      <section className="landing-section min-h-screen relative flex items-center pt-24">
        {/* Background gradient and shapes */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-gray-50" />
        <BackgroundShapes />
        
        <div className="container mx-auto px-6 relative z-10 py-20">
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Hero Text Content */}
            <motion.div 
              className="parallax-element md:w-1/2"
              style={{
                opacity: useTransform(scrollYProgress, [0, 0.3], [1, 0]),
                y: useTransform(scrollYProgress, [0, 0.3], [0, -50])
              }}
            >
              
              <motion.h1
                className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 font-['Playfair_Display']"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Skip the <span className="text-blue-600">guesswork</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Discover and book local service providers, recommended by your campus community.
              </motion.p>
              
              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <div className="flex-shrink-0">
                  <ModernButton 
                    variant="primary"
                    size="lg"
                    icon={<ArrowRight className="h-5 w-5" />}
                    iconPosition="right"
                    href="/signup"
                  >
                    Get Started
                  </ModernButton>
                </div>
                
                <div className="flex-shrink-0">
                  <ModernButton 
                    variant="outline"
                    size="lg"
                    onClick={() => scrollToSection("how-it-works")}
                  >
                    Learn More
                  </ModernButton>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Hero Visual/Image */}
            <motion.div 
              className="parallax-element md:w-1/2 relative"
              style={{
                scale: useTransform(scrollYProgress, [0, 0.3], [1, 0.9]),
                opacity: useTransform(scrollYProgress, [0, 0.3], [1, 0.8]),
                y: useTransform(scrollYProgress, [0, 0.3], [0, 50])
              }}
            >
              <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
                <div className="flex items-center p-3 bg-gray-50 rounded-xl mb-4">
                  <Search className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-500">Find your beauty provider...</span>
                </div>
                
                <div className="space-y-3">
                  {[
                    { name: "Sarah's Hair Studio", type: "Haircuts & Styling" },
                    { name: "Glow Beauty", type: "Makeup & Skincare" },
                  ].map((item, i) => (
                    <motion.div 
                      key={item.name}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + (i * 0.2) }}
                    >
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.type}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="landing-section min-h-screen bg-white py-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-blue-600 font-semibold">Why choose aro</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2 mb-6">Everything you need in one place</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Find, connect, and book with beauty professionals from your campus community</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Search className="h-6 w-6" />, 
                title: "Easy Discovery", 
                description: "Find beauty professionals near your campus, vetted by fellow students."
              },
              { 
                icon: <MessageSquare className="h-6 w-6" />, 
                title: "Direct Communication", 
                description: "Chat with providers to ask questions and coordinate appointments."
              },
              { 
                icon: <Calendar className="h-6 w-6" />, 
                title: "Simple Booking", 
                description: "Book appointments that work with your student schedule."
              }
            ].map((feature, index) => (
              <motion.div 
                key={feature.title}
                className="p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <div className="p-4 bg-blue-100 rounded-xl inline-block mb-6">
                  <div className="text-blue-600">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="landing-section min-h-screen bg-gray-50 py-20">
        <BackgroundShapes />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mt-2 mb-6">How aro Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Find, connect, and book beauty services in just a few simple steps</p>
          </motion.div>
          
          <div className="space-y-24">
            {[
              { 
                step: "01",
                title: "Search for Services", 
                description: "Browse through vetted service providers in your campus area, filtered by service type, price range, and availability.",
                image: (
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg mb-4">
                      <Search className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-500">Hair stylists near campus</span>
                    </div>
                    {[1, 2].map((i) => (
                      <motion.div 
                        key={i}
                        className="p-3 bg-gray-50 hover:bg-blue-50 rounded-lg mb-2 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1 + (i * 0.2) }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Provider {i}</div>
                            <div className="text-sm text-gray-500">0.5 miles away</div>
                          </div>
                          <div className="text-sm font-medium text-blue-600">View</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
              },
              { 
                step: "02",
                title: "Check Availability", 
                description: "View provider profiles, check their availability, and read reviews from other students on your campus.",
                image: (
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {['10:00', '11:30', '1:00', '2:30'].map((time, i) => (
                        <motion.div 
                          key={time}
                          className={`p-3 text-center ${i === 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-700'} rounded-lg hover:bg-blue-50 transition-colors cursor-pointer`}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.8 + (i * 0.1) }}
                        >
                          {time}
                        </motion.div>
                      ))}
                    </div>
                    <div className="w-full">
                      <ModernButton 
                        variant="primary" 
                        size="sm" 
                        className="w-full"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Appointment
                      </ModernButton>
                    </div>
                  </div>
                )
              },
              { 
                step: "03",
                title: "Book & Connect", 
                description: "Schedule your appointment, communicate directly with your provider, and receive confirmation instantly.",
                image: (
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Booking confirmed!</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Your appointment</div>
                      <div className="font-medium">Thursday at 11:30 AM</div>
                      <div className="text-sm text-gray-500 mt-1">with Sarah's Hair Studio</div>
                    </div>
                  </div>
                )
              }
            ].map((step, index) => (
              <motion.div 
                key={step.title}
                className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                {/* Step Content */}
                <div className="md:w-1/2 text-center md:text-left">
                  <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold mb-6">
                    Step {step.step}
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">{step.description}</p>
                </div>
                
                {/* Step Visual */}
                <div className="md:w-1/2">
                  {step.image}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact/CTA Section */}
      <section id="contact" className="landing-section py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-white text-3xl font-bold mb-8">Ready to get started?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">Join aro today and connect with beauty professionals your campus community recommends.</p>
          <div className="inline-block">
            <ModernButton
              variant="white"
              size="lg"
              href="/signup"
            >
              Sign Up Now
            </ModernButton>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
        <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center text-center gap-6">
          <img
            src={AroLogo}
            alt="ARO Logo"
            className="h-16 brightness-0 invert"
          />

          <a
            href="mailto:info@aro.com"
            className="text-gray-300 hover:text-white text-sm inline-flex items-center gap-2 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>info@aro.com</span>
          </a>

          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
            <a href="/privacy" className="text-gray-300 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-gray-300 hover:text-white transition-colors">
              Terms &amp; Conditions
            </a>
          </nav>

          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} aro. All rights reserved.
          </p>
        </div>
      </div>
  </footer>

    </div>
  );
};

export default LandingPage;
