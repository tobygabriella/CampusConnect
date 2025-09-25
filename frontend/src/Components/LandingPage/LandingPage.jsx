import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import AroLogo from "@/assets/aro.png";
import Aro1 from "@/assets/Aro1.jpg";
import Aro2 from "@/assets/Aro2.jpg";
import Aro3 from "@/assets/Aro3.jpg";
import Aro4 from "@/assets/Aro4.jpg";
import { Link } from "react-router-dom";
import { ArrowRight, Search, MessageSquare, Calendar, Heart } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedElement from "@/Components/Animation/AnimatedElement";
import { useState, useEffect } from "react";

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-screen min-h-screen flex flex-col bg-aro-light-blue">
      {/* Navigation Bar */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg' : 'bg-transparent'}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto py-4 px-6">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/">
                <img src={AroLogo} alt="ARO Logo" className="h-12" />
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-10">
              {/* Main Nav Links */}
              <motion.nav 
                className="flex space-x-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {[
                  { href: "#whats-inside", label: "What's inside" },
                  { href: "#how-it-works", label: "How it works" },
                  { href: "#join-community", label: "Join community" }
                ].map((link, index) => (
                  <motion.a 
                    key={link.href}
                    href={link.href} 
                    className="text-aro-navy font-medium hover:text-aro-accent relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    {link.label}
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-aro-accent" 
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.a>
                ))}
              </motion.nav>

              {/* Auth Buttons */}
              <motion.div
                className="flex items-center space-x-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/login" 
                    className="px-5 py-2 bg-aro-light-blue text-aro-navy font-medium rounded-full hover:bg-aro-bg transition-all"
                  >
                    Log In
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/signup" 
                    className="px-5 py-2 bg-aro-navy text-white font-medium rounded-full hover:bg-aro-blue transition-all"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button 
              className="lg:hidden p-2 rounded-md text-aro-navy hover:bg-aro-light-blue transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => alert('Mobile menu functionality would be implemented here')}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <AnimatedElement animation="fade-in-up" delay={0.1} className="mb-6">
                <h1 className="text-5xl lg:text-6xl font-bold text-aro-navy">
                  Skip the <span className="italic">guesswork</span>
                  <span className="absolute -mt-4 ml-2 text-blue-300 opacity-50">.</span>
                </h1>
              </AnimatedElement>

              <AnimatedElement animation="fade-in-up" delay={0.3}>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Discover and book <span className="text-aro-navy font-medium">local service providers</span>, recommended by your <span className="text-aro-navy font-medium">campus community</span>. From hairstylists to nail artists, find the perfect match for your style.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link to="/signup" className="flex items-center justify-center px-8 py-3 bg-aro-navy text-white rounded-full hover:bg-aro-blue transition-all text-lg font-medium">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <a href="#how-it-works" className="flex items-center justify-center px-8 py-3 bg-white border border-gray-200 text-aro-navy rounded-full hover:bg-aro-bg transition-all text-lg font-medium">
                    Learn More
                  </a>
                </div>
              </AnimatedElement>
            </div>

            <div className="relative">
              <AnimatedElement animation="fade-in" delay={0.6} className="rounded-2xl overflow-hidden shadow-xl">
                <div className="relative bg-white rounded-2xl p-6 pt-12">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-3 rounded-full shadow-md">
                    <Search className="h-6 w-6 text-aro-accent" />
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between p-3 bg-aro-bg rounded-xl mb-3">
                      <div className="flex items-center">
                        <Search className="h-5 w-5 text-aro-gray mr-3" />
                        <input 
                          type="text" 
                          placeholder="Find your service provider" 
                          className="bg-transparent border-none focus:outline-none text-aro-navy w-full"
                          disabled
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
                        <h3 className="font-medium text-aro-navy">Sarah's Hair Studio</h3>
                        <p className="text-sm text-gray-500">Specializes in curly hair</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
                        <h3 className="font-medium text-aro-navy">Nail Art by Emma</h3>
                        <p className="text-sm text-gray-500">Custom designs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedElement>
              <motion.div 
                className="absolute -bottom-6 -right-6 h-24 w-24 bg-aro-accent rounded-full z-[-1]"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 5 }}
              />
              <motion.div 
                className="absolute -top-6 -left-6 h-16 w-16 bg-blue-200 rounded-full z-[-1]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 4, delay: 1 }}
              />
            </div>
          </div>
        </div>
      </section>
      

      {/* Services Section */}
      <section id="whats-inside" className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <AnimatedElement animation="fade-in" delay={0.1} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-aro-navy mb-6">We make it easy to find, trust, and book quality personal care services for you</h2>
          </AnimatedElement>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <AnimatedElement animation="fade-in-up" delay={0.2}>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full">
                <h3 className="text-xl font-bold text-aro-navy text-center mb-4">Peer-Vetted Providers</h3>
                <p className="text-gray-600 text-center">
                  All service providers are verified and reviewed by fellow students in your campus community
                </p>
              </div>
            </AnimatedElement>

            {/* Feature Card 2 */}
            <AnimatedElement animation="fade-in-up" delay={0.4}>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full">
                <h3 className="text-xl font-bold text-aro-navy text-center mb-4">Local Discovery</h3>
                <p className="text-gray-600 text-center">
                  Find beauty and grooming professionals near your campus
                </p>
              </div>
            </AnimatedElement>

            {/* Feature Card 3 */}
            <AnimatedElement animation="fade-in-up" delay={0.6}>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full">
                <h3 className="text-xl font-bold text-aro-navy text-center mb-4">Direct Communication</h3>
                <p className="text-gray-600 text-center">
                  Chat directly with providers to discuss your needs, ask questions, and coordinate appointments seamlessly
                </p>
              </div>
            </AnimatedElement>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {/* Feature Card 4 */}
            <AnimatedElement animation="fade-in-up" delay={0.8}>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full">
                <h3 className="text-xl font-bold text-aro-navy text-center mb-4">Easy Scheduling</h3>
                <p className="text-gray-600 text-center">
                  Book appointments that fit your busy student schedule with our streamlined booking system
                </p>
              </div>
            </AnimatedElement>

            {/* Feature Card 5 */}
            <AnimatedElement animation="fade-in-up" delay={1.0}>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full">
                <h3 className="text-xl font-bold text-aro-navy text-center mb-4">Campus Community</h3>
                <p className="text-gray-600 text-center">
                  Join discussion groups, share photos, and connect with other students about beauty trends and recommendations
                </p>
              </div>
            </AnimatedElement>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-aro-light-blue">
        <div className="container mx-auto px-6 max-w-6xl">
          <AnimatedElement animation="fade-in" className="text-center mb-16">
            <h2 className="text-4xl font-bold text-aro-navy mb-4">How Aro works</h2>
          </AnimatedElement>
          
          <div className="space-y-16">
            {/* Step 1 */}
            <AnimatedElement animation="fade-in-up" delay={0.2}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 bg-blue-100 rounded-full h-20 w-20 flex items-center justify-center">
                  <Search className="h-8 w-8 text-aro-blue" />
                  <div className="absolute -top-2 -left-2 bg-white rounded-full px-3 py-1 text-sm font-bold text-aro-navy border border-gray-100 shadow-sm">
                    01
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-aro-navy mb-2">Discover Providers</h3>
                  <p className="text-gray-600">
                    Browse through vetted beauty professionals in your area. See their specialties, certifications, and student reviews
                  </p>
                </div>
                <div className="md:w-1/3 bg-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center mb-3">
                    <Search className="h-5 w-5 text-aro-accent mr-2" />
                    <div className="text-sm text-gray-500">Search results</div>
                  </div>
                  <div>
                    <div className="mb-3 p-2 border-b border-gray-100">
                      <h4 className="font-medium">Sarah's Hair Studio</h4>
                      <p className="text-xs text-gray-500">Specializes in curly hair</p>
                    </div>
                    <div className="p-2">
                      <h4 className="font-medium">Nail Art by Emma</h4>
                      <p className="text-xs text-gray-500">Custom designs</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedElement>

            {/* Step 2 */}
            <AnimatedElement animation="fade-in-up" delay={0.4}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:order-3 flex-shrink-0 bg-blue-100 rounded-full h-20 w-20 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-aro-blue" />
                  <div className="absolute -top-2 -left-2 bg-white rounded-full px-3 py-1 text-sm font-bold text-aro-navy border border-gray-100 shadow-sm">
                    02
                  </div>
                </div>
                <div className="md:order-2 flex-grow">
                  <h3 className="text-2xl font-bold text-aro-navy mb-2">Check Reviews & Ratings</h3>
                  <p className="text-gray-600">
                    Read reviews from fellow students and see ratings to make informed decisions about your beauty care.
                  </p>
                </div>
                <div className="md:order-1 md:w-1/3 bg-white p-4 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium">Recent Reviews</div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">"Absolutely loved my haircut! Emma really understood what I wanted and the price was perfect for my student budget."</p>
                  <p className="text-xs text-gray-500">— Jessica T., 3 days ago</p>
                </div>
              </div>
            </AnimatedElement>

            {/* Step 3 */}
            <AnimatedElement animation="fade-in-up" delay={0.6}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 bg-blue-100 rounded-full h-20 w-20 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-aro-blue" />
                  <div className="absolute -top-2 -left-2 bg-white rounded-full px-3 py-1 text-sm font-bold text-aro-navy border border-gray-100 shadow-sm">
                    03
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-aro-navy mb-2">Book Your Appointments</h3>
                  <p className="text-gray-600">
                    Message providers directly and schedule appointments that work with your busy student schedule.
                  </p>
                </div>
                <div className="md:w-1/3 bg-white p-4 rounded-xl shadow-lg">
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-2">Book an appointment</div>
                    <div className="grid grid-cols-4 gap-1">
                      {['10:00', '11:30', '1:00', '2:30'].map((time) => (
                        <div key={time} className="p-2 text-xs text-center bg-aro-light-blue rounded-lg hover:bg-blue-200 transition-colors cursor-pointer">
                          {time}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="w-full mt-2 bg-aro-navy text-white py-2 rounded-lg text-sm font-medium">
                    Confirm Booking
                  </button>
                </div>
              </div>
            </AnimatedElement>

            {/* Step 4 */}
            <AnimatedElement animation="fade-in-up" delay={0.8}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:order-3 flex-shrink-0 bg-blue-100 rounded-full h-20 w-20 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-aro-blue" />
                  <div className="absolute -top-2 -left-2 bg-white rounded-full px-3 py-1 text-sm font-bold text-aro-navy border border-gray-100 shadow-sm">
                    04
                  </div>
                </div>
                <div className="md:order-2 flex-grow">
                  <h3 className="text-2xl font-bold text-aro-navy mb-2">Share Your Experience</h3>
                  <p className="text-gray-600">
                    After your service, share photos and reviews to help other students discover great providers.
                  </p>
                </div>
                <div className="md:order-1 md:w-1/3 bg-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 mr-2"></div>
                      <div>
                        <p className="text-sm font-medium">@jessica_styles</p>
                        <p className="text-xs text-gray-500">New set! ✨</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden mb-2">
                    <div className="h-32 bg-gray-100"></div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Heart className="h-3 w-3 mr-1" /> 206
                    <MessageSquare className="h-3 w-3 ml-3 mr-1" /> 14
                  </div>
                </div>
              </div>
            </AnimatedElement>
          </div>
        </div>
      </section>


      {/* Campus Community Section */}
      <section id="join-community" className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <AnimatedElement animation="fade-in" className="text-center mb-16">
            <h2 className="text-4xl font-bold text-aro-navy mb-4">Join your campus community</h2>
            <p className="text-xl text-gray-600 mx-auto max-w-3xl">
              Share your experiences, discover new trends, and support your friends on their beauty and grooming journies
            </p>
          </AnimatedElement>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <AnimatedElement animation="fade-in-up" delay={0.2}>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-xl font-bold text-aro-navy mb-3">Campus Convos</h3>
                  <p className="text-gray-600">
                    Join conversations about trends, share tips, and ask for recommendations from your campus community.
                  </p>
                </div>
              </AnimatedElement>
              
              <AnimatedElement animation="fade-in-up" delay={0.4}>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-xl font-bold text-aro-navy mb-3">Share Your Look</h3>
                  <p className="text-gray-600">
                    Post photos of your service and showcase your new look
                  </p>
                </div>
              </AnimatedElement>
              
              <AnimatedElement animation="fade-in-up" delay={0.6}>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-xl font-bold text-aro-navy mb-3">Trending Styles</h3>
                  <p className="text-gray-600">
                    Stay up-to-date with the latest trends popular at your university
                  </p>
                </div>
              </AnimatedElement>
            </div>
            
            <AnimatedElement animation="fade-in" delay={0.6}>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-aro-navy">Campus Highlights</h3>
                </div>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">@jessica_styles</p>
                      <p className="text-xs text-gray-500">New set! ✨</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden mb-3">
                    {/* This would be an image of nails */}
                    <div className="h-64 bg-gray-100 rounded-xl"></div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Heart className="h-4 w-4 mr-1 text-red-500" /> 206
                    <MessageSquare className="h-4 w-4 ml-4 mr-1 text-gray-400" /> 14
                  </div>
                </div>
              </div>
            </AnimatedElement>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-aro-navy to-aro-blue text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <AnimatedElement animation="fade-in" delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to connect with your campus beauty network?</h2>
            <p className="text-xl mb-10 opacity-90">Join Aro today and discover the beauty professionals your campus loves.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup" className="px-8 py-3 bg-white text-aro-navy rounded-full hover:bg-opacity-90 transition-all text-lg font-medium">
                Sign Up Now
              </Link>
              <Link to="/login" className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 transition-all text-lg font-medium">
                Log In
              </Link>
            </div>
          </AnimatedElement>
        </div>
      </section>
      
      {/* Simplified Footer */}
      <footer className="bg-white py-10 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center">
            <AnimatedElement animation="fade-in" delay={0.1}>
              <Link to="/">
                <img src={AroLogo} alt="ARO Logo" className="h-12 mb-4" />
              </Link>
            </AnimatedElement>
            
            <AnimatedElement animation="fade-in" delay={0.2}>
              <a 
                href="mailto:info@aro.com" 
                className="text-aro-accent hover:text-aro-navy transition-all text-lg font-medium my-3"
              >
                info@aro.com
              </a>
            </AnimatedElement>
            
            <AnimatedElement animation="fade-in" delay={0.3}>
              <p className="text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Aro. All rights reserved.
              </p>
            </AnimatedElement>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;