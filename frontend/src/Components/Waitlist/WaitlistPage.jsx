import React, { useRef, useState } from "react";
import phones from "../../assets/phones.jpg";
import brianPage from "../../assets/Brian.png";
import sarahPage from "../../assets/Sarah.png";
import AroLogo from "@/assets/aro.png";
import api from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";
import AnimatedElement from "@/Components/Animation/AnimatedElement";
import { MessageSquare, Calendar, Heart, Search, ArrowRight, User, Mail, Map, School, Send, CheckCircle } from "lucide-react";

const WaitlistPage = () => {
  const formRef = useRef(null);

  const scrollToForm = () => {
    formRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    school: "",
    cityState: "",
    role: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/waitlist", formData);
      toast.success("You've joined the waitlist successfully!");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        school: "",
        cityState: "",
        role: "",
      });
    } catch (error) {
      toast.error("Failed to join waitlist.");
    }
  };

  return (
    <div className="font-sans text-aro-navy bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-aro-light-blue to-white overflow-hidden">
        {/* Navigation */}
        <motion.nav 
          className="py-6 px-6"  
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto flex justify-between items-center">
            <img 
              src={AroLogo} 
              alt="Aro Logo" 
              className="h-12" 
            />
            <div className="flex space-x-4">
              <ModernButton 
                onClick={scrollToForm}
                variant="primary"
                size="md"
                rounded="full"
                icon={<ArrowRight className="h-4 w-4" />}
                iconPosition="right"
              >
                Join Waitlist
              </ModernButton>
            </div>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-12 md:mb-0">
              <AnimatedElement animation="fade-in-up" delay={0.2}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Campus looks, made easy</h1>
                <p className="text-xl md:text-2xl text-gray-700 mb-8">
                  Find the right beauty and grooming providers from your campus community.  
                </p>
                <ModernButton
                  onClick={scrollToForm}
                  variant="primary"
                  size="lg"
                  rounded="full"
                  icon={<ArrowRight className="h-5 w-5" />}
                  iconPosition="right"
                  className="shadow-lg"
                >
                  Join the waitlist
                </ModernButton>
              </AnimatedElement>
            </div>
            
            <div className="md:w-1/2 relative">
              <AnimatedElement animation="fade-in" delay={0.4}>
                <div className="relative z-10">
                  <img 
                    src={phones} 
                    alt="App preview on phones" 
                    className="w-full max-w-lg mx-auto rounded-2xl shadow-xl" 
                  />
                </div>
              </AnimatedElement>
              <motion.div 
                className="absolute -bottom-6 -right-6 h-24 w-24 bg-aro-accent rounded-full z-[1]"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 5 }}
              />
              <motion.div 
                className="absolute -top-6 -left-6 h-16 w-16 bg-blue-200 rounded-full z-[1]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 4, delay: 1 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <AnimatedElement animation="fade-in" className="text-center mb-16">
            <h2 className="text-3xl font-bold text-aro-navy mb-6">Everything you need in one place</h2>
            <p className="text-xl text-gray-600 mx-auto max-w-3xl">Aro makes finding and booking beauty services as easy as possible for college students</p>
          </AnimatedElement>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedElement animation="fade-in-up" delay={0.2}>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full">
                <div className="bg-blue-100 p-3 rounded-2xl inline-block mb-4">
                  <Search className="h-6 w-6 text-aro-blue" />
                </div>
                <h3 className="text-xl font-bold text-aro-navy mb-3">Find Service Providers with Ease</h3>
                <p className="text-gray-600">
                  Skip the hassle—rely on those you trust to discover new service providers quickly and confidently.
                </p>
              </div>
            </AnimatedElement>
            
            <AnimatedElement animation="fade-in-up" delay={0.4}>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full">
                <div className="bg-blue-100 p-3 rounded-2xl inline-block mb-4">
                  <MessageSquare className="h-6 w-6 text-aro-blue" />
                </div>
                <h3 className="text-xl font-bold text-aro-navy mb-3">Connect with your Community</h3>
                <p className="text-gray-600">
                  Engage, discuss, and get inspired by others' beauty and grooming experiences on your campus.
                </p>
              </div>
            </AnimatedElement>
            
            <AnimatedElement animation="fade-in-up" delay={0.6}>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full">
                <div className="bg-blue-100 p-3 rounded-2xl inline-block mb-4">
                  <Calendar className="h-6 w-6 text-aro-blue" />
                </div>
                <h3 className="text-xl font-bold text-aro-navy mb-3">All-in-One Management</h3>
                <p className="text-gray-600">
                  Seamlessly manage conversations, connections, appointments, and payments—all in one secure place.
                </p>
              </div>
            </AnimatedElement>
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section ref={formRef} className="py-24 px-6 bg-aro-light-blue">
        <AnimatedElement animation="fade-in" className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-aro-navy mb-4">
            Join the Waitlist
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Are you a student looking to book beauty services trusted by your campus? Or a provider ready to grow your client base?
            Sign up below to be the first to know when Aro launches near you.
          </p>
        </AnimatedElement>
        
        <AnimatedElement animation="fade-in-up" delay={0.3}>
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    name="firstName"
                    placeholder="First Name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10 w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-aro-accent focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    name="lastName"
                    placeholder="Last Name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="pl-10 w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-aro-accent focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-aro-accent focus:border-transparent transition-all"
                />
              </div>
              
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <School className="h-5 w-5" />
                </div>
                <input
                  name="school"
                  placeholder="School (if applicable)"
                  value={formData.school}
                  onChange={handleChange}
                  className="pl-10 w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-aro-accent focus:border-transparent transition-all"
                />
              </div>
              
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Map className="h-5 w-5" />
                </div>
                <input
                  name="cityState"
                  placeholder="City, State"
                  required
                  value={formData.cityState}
                  onChange={handleChange}
                  className="pl-10 w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-aro-accent focus:border-transparent transition-all"
                />
              </div>

              <select
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-aro-accent focus:border-transparent transition-all text-gray-700"
              >
                <option value="" disabled>I am a...</option>
                <option value="student">Student</option>
                <option value="provider">Provider</option>
              </select>

              <ModernButton
                type="submit"
                variant="primary"
                size="lg"
                className="mt-6 w-full shadow-md"
                icon={<Send className="h-5 w-5" />}
                iconPosition="right"
              >
                Join Waitlist
              </ModernButton>
            </form>
          </div>
        </AnimatedElement>
      </section>

      {/* App Examples Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <AnimatedElement animation="fade-in" className="text-center mb-16">
            <h2 className="text-3xl font-bold text-aro-navy mb-6">See Aro in action</h2>
            <p className="text-xl text-gray-600 mx-auto max-w-3xl">Here's a preview of the Aro experience</p>
          </AnimatedElement>
          
          <div className="space-y-16">
            <AnimatedElement animation="fade-in-up">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <img src={brianPage} alt="Brian Page Example" className="w-full" />
              </div>
            </AnimatedElement>

            <AnimatedElement animation="fade-in-up" delay={0.3}>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <img src={sarahPage} alt="Sarah Page Example" className="w-full" />
              </div>
            </AnimatedElement>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-aro-navy to-aro-blue text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <AnimatedElement animation="fade-in" delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your campus beauty experience?</h2>
            <p className="text-xl mb-10 opacity-90">Join the Aro waitlist today and be the first to know when we launch at your campus.</p>
            <ModernButton
              onClick={scrollToForm}
              variant="white"
              size="lg"
              rounded="full"
              className="shadow-lg"
              icon={<CheckCircle className="h-5 w-5" />}
              iconPosition="right"
            >
              Join Waitlist Now
            </ModernButton>
          </AnimatedElement>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <img src={AroLogo} alt="ARO Logo" className="h-10 mb-4" />
              <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Aro. All rights reserved.</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Contact: <a href="mailto:info@aro.com" className="text-aro-accent hover:text-aro-navy transition-colors">info@aro.com</a></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WaitlistPage;