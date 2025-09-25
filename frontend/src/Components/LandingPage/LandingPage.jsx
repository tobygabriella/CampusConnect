import { ArrowRight, Search, MessageSquare, Calendar, Heart, Menu, X, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";

// Import style overrides
import "@/styles/component-overrides.css";

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Faster parallax transforms - content appears much sooner
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], ["0%", "-20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const servicesParallax = useTransform(scrollYProgress, [0.1, 0.4], ["-10%", "10%"]);
  const stepsParallax = useTransform(scrollYProgress, [0.2, 0.6], ["-5%", "15%"]);
  
  // Spring animations for smoother movement
  const smoothHeroParallax = useSpring(heroParallax, { stiffness: 100, damping: 30 });
  const smoothServicesParallax = useSpring(servicesParallax, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: "whats-inside", label: "What's inside" },
    { id: "how-it-works", label: "How it works" },
    { id: "join-community", label: "Join community" }
  ];

  return (
    <div ref={containerRef} className="landing-page-container w-screen min-h-screen flex flex-col overflow-x-hidden bg-white">
      {/* Navigation Bar */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white shadow-lg border-b border-gray-200' 
            : 'bg-white/95 backdrop-blur-sm'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto py-4 px-6">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <ModernButton 
                variant="text"
                size="lg"
                onClick={() => window.scrollTo(0, 0)}
                className="!p-0 text-2xl font-bold text-blue-600 hover:text-blue-700"
              >
                ARO
              </ModernButton>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <nav className="flex space-x-6">
                {navItems.map((item) => (
                  <ModernButton
                    key={item.id}
                    variant="text"
                    size="sm"
                    onClick={() => scrollToSection(item.id)}
                    className="relative group font-medium"
                  >
                    {item.label}
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                  </ModernButton>
                ))}
              </nav>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-3 ml-6">
                <ModernButton 
                  variant="ghost"
                  size="sm"
                  onClick={() => alert('Login functionality would be implemented here')}
                >
                  Log In
                </ModernButton>
                <ModernButton 
                  variant="primary"
                  size="sm"
                  onClick={() => alert('Signup functionality would be implemented here')}
                >
                  Sign Up
                </ModernButton>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <ModernButton 
              variant="ghost"
              size="sm"
              className="lg:hidden !p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </ModernButton>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            className="lg:hidden bg-white border-t border-gray-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-6 py-4 space-y-4">
              {navItems.map((item) => (
                <ModernButton
                  key={item.id}
                  variant="text"
                  size="sm"
                  onClick={() => scrollToSection(item.id)}
                  className="w-full justify-start py-2"
                >
                  {item.label}
                </ModernButton>
              ))}
              <div className="flex space-x-4 pt-4 border-t border-gray-100">
                <ModernButton 
                  variant="ghost"
                  size="sm"
                  onClick={() => alert('Login functionality would be implemented here')}
                >
                  Log In
                </ModernButton>
                <ModernButton 
                  variant="primary"
                  size="sm"
                  onClick={() => alert('Signup functionality would be implemented here')}
                >
                  Sign Up
                </ModernButton>
              </div>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="relative pt-32 pb-20 px-6 min-h-screen flex items-center bg-gradient-to-br from-gray-50 to-blue-50"
        style={{ 
          y: smoothHeroParallax,
          opacity: heroOpacity 
        }}
      >
        {/* Background Elements */}
        <motion.div 
          className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          style={{ 
            y: useTransform(scrollYProgress, [0, 0.3], ["0px", "-50px"]),
            scale: useTransform(scrollYProgress, [0, 0.3], [1, 0.8])
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-64 h-64 bg-gray-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          style={{ 
            y: useTransform(scrollYProgress, [0, 0.3], ["0px", "30px"]),
            scale: useTransform(scrollYProgress, [0, 0.3], [1, 1.2])
          }}
        />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="mb-6"
                style={{
                  y: useTransform(scrollYProgress, [0, 0.2], ["0px", "-25px"]),
                  opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0])
                }}
              >
                <h1 className="text-6xl lg:text-7xl font-black text-gray-900 leading-tight">
                  Skip the{" "}
                  <span className="italic text-blue-600">
                    guesswork
                  </span>
                </h1>
              </motion.div>

              <motion.div
                style={{
                  y: useTransform(scrollYProgress, [0, 0.2], ["0px", "-15px"]),
                  opacity: useTransform(scrollYProgress, [0, 0.18], [1, 0])
                }}
              >
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Discover and book{" "}
                  <span className="font-semibold text-blue-600">
                    local service providers
                  </span>
                  , recommended by your{" "}
                  <span className="font-semibold text-blue-600">
                    campus community
                  </span>
                  . From hairstylists to nail artists, find the perfect match for your style.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ModernButton 
                      variant="primary"
                      size="lg"
                      icon={<ArrowRight className="h-5 w-5" />}
                      iconPosition="right"
                      className="rounded-full text-lg px-8 py-6"
                      onClick={() => alert('Signup functionality would be implemented here')}
                    >
                      Get Started
                    </ModernButton>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ModernButton 
                      variant="outline"
                      size="lg"
                      className="rounded-full text-lg px-8 py-6"
                      onClick={() => scrollToSection('how-it-works')}
                    >
                      Learn More
                    </ModernButton>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{
                y: useTransform(scrollYProgress, [0, 0.2], ["0px", "-40px"]),
                scale: useTransform(scrollYProgress, [0, 0.2], [1, 0.95]),
                opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0])
              }}
            >
              <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 pt-16 shadow-2xl border border-gray-200">
                <motion.div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 p-4 rounded-full shadow-lg"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Search className="h-6 w-6 text-white" />
                </motion.div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-4">
                    <div className="flex items-center">
                      <Search className="h-5 w-5 text-gray-400 mr-3" />
                      <input 
                        type="text" 
                        placeholder="Find your service provider" 
                        className="bg-transparent border-none focus:outline-none text-gray-700 w-full font-medium"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "Sarah's Hair Studio", specialty: "Specializes in curly hair" },
                      { name: "Nail Art by Emma", specialty: "Custom designs" }
                    ].map((provider, index) => (
                      <motion.div 
                        key={provider.name}
                        className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                        whileHover={{ scale: 1.02, y: -2 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <h3 className="font-semibold text-gray-800">{provider.name}</h3>
                        <p className="text-sm text-gray-500">{provider.specialty}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              <motion.div 
                className="absolute -bottom-8 -right-8 h-24 w-24 bg-blue-300 rounded-full z-[-1]"
                style={{
                  scale: useTransform(scrollYProgress, [0, 0.15], [1, 1.2]),
                  y: useTransform(scrollYProgress, [0, 0.15], ["0px", "10px"])
                }}
              />
              <motion.div 
                className="absolute -top-8 -left-8 h-20 w-20 bg-gray-300 rounded-full z-[-1]"
                style={{
                  scale: useTransform(scrollYProgress, [0, 0.15], [1, 0.8]),
                  y: useTransform(scrollYProgress, [0, 0.15], ["0px", "-15px"])
                }}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>
      
      {/* Services Section */}
      <motion.section 
        id="whats-inside" 
        className="py-24 bg-white relative overflow-hidden"
        style={{ y: smoothServicesParallax }}
      >
        <motion.div 
          className="absolute top-0 right-0 w-96 h-96 bg-gray-100 rounded-full filter blur-3xl opacity-50"
          style={{ 
            y: useTransform(scrollYProgress, [0.1, 0.4], ["25px", "-25px"]),
            rotate: useTransform(scrollYProgress, [0.1, 0.4], [0, 45])
          }}
        />
        
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <motion.div
            className="text-center mb-16"
            style={{
              opacity: useTransform(scrollYProgress, [0.05, 0.15], [0, 1]),
              y: useTransform(scrollYProgress, [0.05, 0.15], ["50px", "0px"])
            }}
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              We make it easy to find, trust, and book quality personal care services for you
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {[
              { title: "Peer-Vetted Providers", desc: "All service providers are verified and reviewed by fellow students in your campus community" },
              { title: "Local Discovery", desc: "Find beauty and grooming professionals near your campus" },
              { title: "Direct Communication", desc: "Chat directly with providers to discuss your needs, ask questions, and coordinate appointments seamlessly" }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group bg-white p-8 rounded-3xl border border-gray-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-500 h-full"
                style={{
                  opacity: useTransform(scrollYProgress, [0.08 + index * 0.01, 0.18 + index * 0.01], [0, 1]),
                  y: useTransform(scrollYProgress, [0.08 + index * 0.01, 0.18 + index * 0.01], ["40px", "0px"]),
                  scale: useTransform(scrollYProgress, [0.08 + index * 0.01, 0.18 + index * 0.01], [0.95, 1])
                }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <h3 className="text-xl font-bold text-gray-800 text-center mb-4 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "Easy Scheduling", desc: "Book appointments that fit your busy student schedule with our streamlined booking system" },
              { title: "Campus Community", desc: "Join discussion groups, share photos, and connect with other students about beauty trends and recommendations" }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group bg-white p-8 rounded-3xl border border-gray-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-500 h-full"
                style={{
                  opacity: useTransform(scrollYProgress, [0.15 + index * 0.01, 0.25 + index * 0.01], [0, 1]),
                  y: useTransform(scrollYProgress, [0.15 + index * 0.01, 0.25 + index * 0.01], ["40px", "0px"]),
                  scale: useTransform(scrollYProgress, [0.15 + index * 0.01, 0.25 + index * 0.01], [0.95, 1])
                }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <h3 className="text-xl font-bold text-gray-800 text-center mb-4 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        id="how-it-works" 
        className="py-24 bg-gray-50 relative overflow-hidden"
        style={{ y: stepsParallax }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-gray-100/50"></div>
        
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <motion.div
            className="text-center mb-16"
            style={{
              opacity: useTransform(scrollYProgress, [0.2, 0.3], [0, 1]),
              y: useTransform(scrollYProgress, [0.2, 0.3], ["50px", "0px"])
            }}
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              How Aro works
            </h2>
          </motion.div>
          
          <div className="space-y-20">
            {[
              {
                step: "01",
                icon: Search,
                title: "Discover Providers",
                desc: "Browse through vetted beauty professionals in your area. See their specialties, certifications, and student reviews",
                content: "Search results"
              },
              {
                step: "02",
                icon: MessageSquare,
                title: "Check Reviews & Ratings",
                desc: "Read reviews from fellow students and see ratings to make informed decisions about your beauty care.",
                content: "Recent Reviews"
              },
              {
                step: "03",
                icon: Calendar,
                title: "Book Your Appointments",
                desc: "Message providers directly and schedule appointments that work with your busy student schedule.",
                content: "Book an appointment"
              },
              {
                step: "04",
                icon: Heart,
                title: "Share Your Experience",
                desc: "After your service, share photos and reviews to help other students discover great providers.",
                content: "New set! ✨"
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}
                style={{
                  opacity: useTransform(scrollYProgress, [0.25 + index * 0.03, 0.35 + index * 0.03], [0, 1]),
                  y: useTransform(scrollYProgress, [0.25 + index * 0.03, 0.35 + index * 0.03], ["50px", "0px"]),
                  scale: useTransform(scrollYProgress, [0.25 + index * 0.03, 0.35 + index * 0.03], [0.9, 1])
                }}
              >
                <div className="relative flex-shrink-0">
                  <motion.div 
                    className="bg-blue-600 rounded-full h-24 w-24 flex items-center justify-center shadow-xl"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      y: useTransform(scrollYProgress, [0.25 + index * 0.03, 0.5], ["0px", `-${5 + index * 3}px`])
                    }}
                  >
                    <step.icon className="h-10 w-10 text-white" />
                  </motion.div>
                  <div className="absolute -top-3 -left-3 bg-white rounded-full px-4 py-2 text-sm font-bold text-gray-800 border border-gray-200 shadow-lg">
                    {step.step}
                  </div>
                </div>
                
                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">{step.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
                
                <motion.div 
                  className="md:w-1/3 bg-white p-6 rounded-2xl shadow-xl border border-gray-200"
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    y: useTransform(scrollYProgress, [0.25 + index * 0.03, 0.5], ["0px", `${3 + index * 2}px`])
                  }}
                >
                  <div className="text-sm font-medium mb-3 text-gray-700">{step.content}</div>
                  {step.step === "01" && (
                    <div className="space-y-2">
                      <div className="p-3 border-b border-gray-100">
                        <h4 className="font-medium text-gray-800">Sarah's Hair Studio</h4>
                        <p className="text-xs text-gray-500">Specializes in curly hair</p>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-gray-800">Nail Art by Emma</h4>
                        <p className="text-xs text-gray-500">Custom designs</p>
                      </div>
                    </div>
                  )}
                  {step.step === "02" && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">"Absolutely loved my haircut! Emma really understood what I wanted and the price was perfect for my student budget."</p>
                      <p className="text-xs text-gray-500">— Jessica T., 3 days ago</p>
                    </div>
                  )}
                  {step.step === "03" && (
                    <div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {['10:00', '11:30', '1:00', '2:30'].map((time) => (
                          <motion.div 
                            key={time} 
                            className="p-2 text-xs text-center bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                          >
                            {time}
                          </motion.div>
                        ))}
                      </div>
                      <ModernButton
                        variant="primary"
                        size="md"
                        className="w-full"
                        icon={<Calendar className="h-4 w-4" />}
                        iconPosition="left"
                      >
                        Confirm Booking
                      </ModernButton>
                    </div>
                  )}
                  {step.step === "04" && (
                    <div>
                      <div className="flex items-center mb-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 mr-2"></div>
                        <div>
                          <p className="text-sm font-medium">@jessica_styles</p>
                          <p className="text-xs text-gray-500">New set! ✨</p>
                        </div>
                      </div>
                      <div className="h-24 bg-gray-100 rounded-lg mb-3"></div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Heart className="h-3 w-3 mr-1 text-blue-500" /> 206
                        <MessageSquare className="h-3 w-3 ml-3 mr-1" /> 14
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Campus Community Section */}
      <motion.section 
        id="join-community" 
        className="py-24 bg-white relative overflow-hidden"
        style={{
          opacity: useTransform(scrollYProgress, [0.45, 0.55], [0, 1]),
          y: useTransform(scrollYProgress, [0.45, 0.6], ["50px", "0px"])
        }}
      >
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <motion.div
            className="text-center mb-16"
            style={{
              opacity: useTransform(scrollYProgress, [0.48, 0.53], [0, 1]),
              y: useTransform(scrollYProgress, [0.48, 0.53], ["30px", "0px"])
            }}
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Join your campus community
            </h2>
            <p className="text-xl text-gray-600 mx-auto max-w-3xl leading-relaxed">
              Share your experiences, discover new trends, and support your friends on their beauty and grooming journeys
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              {[
                { title: "Campus Convos", desc: "Join conversations about trends, share tips, and ask for recommendations from your campus community." },
                { title: "Share Your Look", desc: "Post photos of your service and showcase your new look" },
                { title: "Trending Styles", desc: "Stay up-to-date with the latest trends popular at your university" }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  className="group bg-white p-8 rounded-3xl border border-gray-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-500"
                  style={{
                    opacity: useTransform(scrollYProgress, [0.5 + index * 0.01, 0.55 + index * 0.01], [0, 1]),
                    x: useTransform(scrollYProgress, [0.5 + index * 0.01, 0.55 + index * 0.01], ["-30px", "0px"])
                  }}
                  whileHover={{ scale: 1.02, x: 10 }}
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              className="bg-white rounded-3xl border border-gray-200 p-8 shadow-2xl"
              style={{
                opacity: useTransform(scrollYProgress, [0.52, 0.57], [0, 1]),
                x: useTransform(scrollYProgress, [0.52, 0.57], ["30px", "0px"]),
                scale: useTransform(scrollYProgress, [0.52, 0.57], [0.95, 1])
              }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Campus Highlights</h3>
              </div>
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-800">@jessica_styles</p>
                    <p className="text-sm text-gray-500">New set! ✨</p>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden mb-4 h-64 bg-gray-100"></div>
                <div className="flex items-center text-gray-500">
                  <Heart className="h-5 w-5 mr-2 text-blue-500" /> 206
                  <MessageSquare className="h-5 w-5 ml-6 mr-2" /> 14
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-24 bg-blue-600 text-white relative overflow-hidden"
        style={{
          opacity: useTransform(scrollYProgress, [0.6, 0.7], [0, 1]),
          y: useTransform(scrollYProgress, [0.6, 0.75], ["50px", "0px"])
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800"></div>
        <motion.div 
          className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full filter blur-3xl"
          style={{
            scale: useTransform(scrollYProgress, [0.6, 0.8], [1, 1.2]),
            x: useTransform(scrollYProgress, [0.6, 0.8], ["0px", "25px"])
          }}
        />
        <motion.div 
          className="absolute bottom-10 right-10 w-64 h-64 bg-white/10 rounded-full filter blur-3xl"
          style={{
            scale: useTransform(scrollYProgress, [0.6, 0.8], [1.2, 1]),
            x: useTransform(scrollYProgress, [0.6, 0.8], ["0px", "-15px"])
          }}
        />
        
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <motion.div
            style={{
              opacity: useTransform(scrollYProgress, [0.65, 0.7], [0, 1]),
              y: useTransform(scrollYProgress, [0.65, 0.7], ["30px", "0px"])
            }}
          >
            <h2 className="text-white text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to connect with your campus beauty network?
            </h2>
            <p className="text-white text-xl mb-12 opacity-90 leading-relaxed">
              Join Aro today and discover the beauty professionals your campus loves.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <ModernButton 
                  variant="white"
                  size="lg"
                  icon={<ArrowRight className="h-5 w-5" />}
                  iconPosition="right"
                  className="rounded-full text-lg px-10 py-6 text-blue-600 hover:shadow-2xl"
                  onClick={() => alert('Signup functionality would be implemented here')}
                >
                  Sign Up Now
                </ModernButton>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <ModernButton 
                  variant="ghost"
                  size="lg"
                  className="rounded-full text-lg px-10 py-6 text-white border-2 border-white hover:bg-white/10"
                  onClick={() => alert('Login functionality would be implemented here')}
                >
                  Log In
                </ModernButton>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div
              className="flex items-center space-x-8 mb-6 md:mb-0"
              style={{
                opacity: useTransform(scrollYProgress, [0.7, 0.75], [0, 1]),
                y: useTransform(scrollYProgress, [0.7, 0.75], ["20px", "0px"])
              }}
            >
              <button onClick={() => window.scrollTo(0, 0)} className="text-2xl font-bold text-blue-600">
                ARO
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <p className="text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Aro. All rights reserved.
              </p>
            </motion.div>
            
            <motion.div
              className="flex items-center space-x-6"
              style={{
                opacity: useTransform(scrollYProgress, [0.72, 0.77], [0, 1]),
                y: useTransform(scrollYProgress, [0.72, 0.77], ["20px", "0px"])
              }}
            >
              <ModernButton 
                as="a"
                href="mailto:info@aro.com" 
                variant="text"
                size="sm"
                className="text-sm font-medium"
              >
                info@aro.com
              </ModernButton>
              <div className="h-6 w-px bg-gray-300"></div>
              <ModernButton 
                variant="text"
                size="sm"
                onClick={() => scrollToSection('whats-inside')}
                className="text-sm font-medium"
              >
                Features
              </ModernButton>
              <ModernButton 
                variant="text"
                size="sm"
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-medium"
              >
                How it works
              </ModernButton>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ModernButton 
                  variant="primary"
                  size="sm"
                  onClick={() => alert('Signup functionality would be implemented here')}
                  className="rounded-full"
                >
                  Get Started
                </ModernButton>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;