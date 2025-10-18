import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AroLogo from '@/assets/aro.png';

const TermsConditions = () => {
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
          Terms & Conditions
        </motion.h1>
        
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-8"
          variants={itemVariants}
        >
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Introduction</h2>
            <p className="text-gray-600 mb-4">
              Welcome to ARO. These Terms & Conditions govern your use of our website and services 
              offered by ARO. By accessing or using our service, you agree to be bound by these Terms.
            </p>
            <p className="text-gray-600">
              These Terms & Conditions were last updated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Definitions</h2>
            <ul className="list-disc ml-6 text-gray-600 space-y-2">
              <li><strong>"ARO"</strong> refers to our company, known as ARO.</li>
              <li><strong>"Service"</strong> refers to the website and application operated by ARO.</li>
              <li><strong>"User"</strong> refers to the individual using our Service.</li>
              <li><strong>"Provider"</strong> refers to beauty professionals offering services through our platform.</li>
              <li><strong>"Terms"</strong> refers to these Terms & Conditions.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Account Terms</h2>
            <p className="text-gray-600 mb-4">
              When you create an account with us, you must provide accurate, complete, and current information at all times.
              Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
            <p className="text-gray-600 mb-4">
              You are responsible for safeguarding the password that you use to access the Service and for any activities
              or actions under your password, whether your password is with our Service or a third-party service.
            </p>
            <p className="text-gray-600">
              You agree not to disclose your password to any third party. You must notify us immediately upon becoming
              aware of any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Conduct</h2>
            <p className="text-gray-600 mb-4">
              By using our Service, you agree not to:
            </p>
            <ul className="list-disc ml-6 text-gray-600 space-y-2">
              <li>Use the Service in any way that violates any applicable national or international law or regulation</li>
              <li>Use the Service for any harmful or illegal purpose</li>
              <li>Impersonate another person or misrepresent your affiliation with a person or entity</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
              <li>Post defamatory, offensive, or illegal content</li>
              <li>Attempt to bypass any measures we use to prevent or restrict access to the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              The Service and its original content, features, and functionality are and will remain the exclusive
              property of ARO and its licensors. The Service is protected by copyright, trademark, and other laws.
            </p>
            <p className="text-gray-600">
              Our trademarks and trade dress may not be used in connection with any product or service without
              the prior written consent of ARO.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bookings and Payments</h2>
            <p className="text-gray-600 mb-4">
              ARO facilitates bookings between Users and Providers but is not responsible for the services provided.
              Users are responsible for attending scheduled appointments or canceling within the Provider's cancellation policy time frame.
            </p>
            <p className="text-gray-600">
              Payment processing services for Users on ARO are provided by our payment processing partners.
              By using our Service, you agree to be bound by the payment processor's terms of service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              In no event shall ARO, nor its directors, employees, partners, agents, suppliers, or affiliates,
              be liable for any indirect, incidental, special, consequential or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc ml-6 text-gray-600 space-y-2">
              <li>Your access to or use of or inability to access or use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Disclaimer</h2>
            <p className="text-gray-600 mb-4">
              Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis.
              The Service is provided without warranties of any kind, whether express or implied.
            </p>
            <p className="text-gray-600">
              ARO does not warrant that the Service will be uninterrupted, timely, secure, or error-free.
              ARO does not warrant that the results that may be obtained from the use of the Service will be accurate or reliable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
              If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect.
            </p>
            <p className="text-gray-600">
              By continuing to access or use our Service after those revisions become effective,
              you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about these Terms & Conditions, please contact us:
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
            <Link to="/privacy" className="text-gray-600 hover:text-blue-600 text-sm">Privacy Policy</Link>
            <Link to="/terms" className="text-blue-600 hover:text-blue-800 text-sm">Terms & Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsConditions;
