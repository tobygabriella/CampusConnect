import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AroLogo from '@/assets/aro.png';

const PrivacyPolicy = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: 'beforeChildren',
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center">
              <img src={AroLogo} alt="ARO Logo" className="h-12" />
            </Link>
            <nav>
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                Back to Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main 
        className="container mx-auto px-6 py-12 max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-3xl md:text-4xl font-bold mb-8 text-center"
          variants={itemVariants}
        >
          Privacy Policy
        </motion.h1>
        
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-8"
          variants={itemVariants}
        >
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Introduction</h2>
            <p className="text-gray-600 mb-4">
              Welcome to ARO's Privacy Policy. At ARO, we respect your privacy and are committed to protecting your personal data.
              This Privacy Policy will inform you about how we look after your personal data when you visit our website
              and tell you about your privacy rights and how the law protects you.
            </p>
            <p className="text-gray-600">
              This Privacy Policy was last updated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Information We Collect</h2>
            <p className="text-gray-600 mb-4">
              We may collect several different types of information for various purposes to provide and improve our service to you:
            </p>
            <ul className="list-disc ml-6 text-gray-600 space-y-2">
              <li>Personal identification information (Name, email address, phone number, etc.)</li>
              <li>Profile information (Your photo, bio, academic information)</li>
              <li>Usage data (How you interact with our platform)</li>
              <li>Device and connection information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">
              We use the collected data for various purposes:
            </p>
            <ul className="list-disc ml-6 text-gray-600 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so that we can improve our service</li>
              <li>To monitor the usage of our service</li>
              <li>To detect, prevent and address technical issues</li>
              <li>To fulfill any other purpose for which you provide it</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Data Security</h2>
            <p className="text-gray-600 mb-4">
              The security of your data is important to us, but remember that no method of transmission over the Internet
              or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to
              protect your personal data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your Rights</h2>
            <p className="text-gray-600 mb-4">
              ARO aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.
            </p>
            <ul className="list-disc ml-6 text-gray-600 space-y-2">
              <li>The right to access, update or to delete the information we have on you</li>
              <li>The right of rectification</li>
              <li>The right to object</li>
              <li>The right of restriction</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Cookies</h2>
            <p className="text-gray-600 mb-4">
              We use cookies and similar tracking technologies to track the activity on our service and hold certain information.
              Cookies are files with a small amount of data which may include an anonymous unique identifier.
            </p>
            <p className="text-gray-600">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However,
              if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Changes to This Privacy Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "last updated" date.
            </p>
            <p className="text-gray-600">
              You are advised to review this Privacy Policy periodically for any changes. Changes to this
              Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <a 
              href="mailto:info@aro.com" 
              className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              info@aro.com
            </a>
          </section>
        </motion.div>
      </motion.main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} ARO. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4 mt-2">
            <Link to="/privacy" className="text-blue-600 hover:text-blue-800 text-sm">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-600 hover:text-blue-600 text-sm">Terms & Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
