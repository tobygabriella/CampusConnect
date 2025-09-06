import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"; // shadcn/ui card
import AroLogo from "@/assets/aro.png";
import Aro1 from "@/assets/Aro1.jpg";
import Aro2 from "@/assets/Aro2.jpg";
import Aro3 from "@/assets/Aro3.jpg";
import Aro4 from "@/assets/Aro4.jpg";
import { Link} from "react-router-dom";
import { ArrowRight } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="w-screen min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <img src={AroLogo} alt="ARO Logo" className="h-14" /> {/* Adjust height as needed */}
          <div className="space-x-4">
            <a href="#services" className="text-gray-700 hover:text-[#062970]">Services</a>
            <a href="#about" className="text-gray-700 hover:text-[#062970]">About Us</a>
            <a href="#contact" className="text-gray-700 hover:text-[#062970]">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-grow bg-gradient-to-r from-[#062970] to-[#ddb2ef] py-20 text-center flex flex-col justify-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold text-white mb-4">
            Let us point you in the right direction
          </h1>
          <p className="text-xl text-white mb-8">
            Connecting college students with service providers.
          </p>
          <div className="flex justify-center"> 
            <Button className="bg-[#062970] hover:bg-[#051f5a] text-white rounded-lg px-6 py-2 flex items-center space-x-2">
            <Link 
                to="/getting-started" 
                className="flex items-center space-x-2"
                style={{
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                <span style={{ color: 'white' }}>Get Started</span>
                <ArrowRight className="h-4 w-4" color="white" />
              </Link>

            </Button>
          </div>
        </div>
      </section>
      

      {/* Services Section */}
      <section id="services" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#062970] mb-8">
            Our Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service Card 1 */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#062970]">Find Service Providers with Ease </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                    Skip the hassle — rely on those you trust to discover new service providers quickly
                </CardDescription>
              </CardContent>
            </Card>

            {/* Service Card 2 */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#062970]">Connect with your Community</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                   Engage, discuss, and get inspired by others beauty and grooming experiences
                </CardDescription>
              </CardContent>
            </Card>

            {/* Service Card 3 */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#062970]">All-in-One Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                      Seamlessly manage conversations, connections, appointments, and payments — all in one secure place
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-br from-[#eef1f9] to-[#f7edfb] py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#062970] mb-12">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Feature 1 - Staggered Up */}
            <div className="flex flex-col items-center md:-translate-y-8 transition-transform">
              <div className="relative w-[250px] h-[500px] bg-gray-900 rounded-[2.5rem] p-2 shadow-xl overflow-hidden border-[12px] border-gray-900">
                {/* iPhone notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-gray-900 rounded-b-xl z-10"></div>
                {/* Screen content */}
                <div className="relative w-full h-full overflow-hidden rounded-[2rem]">
                  <img
                    src={Aro1}
                    alt="Provider Profile"
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-[#062970] to-transparent" />
                  {/* Text container */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-sm font-medium">
                      Book community-vetted providers — explore profiles, read reviews, and see who in your network has used them
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 - Staggered Down */}
            <div className="flex flex-col items-center md:translate-y-8 transition-transform">
              <div className="relative w-[250px] h-[500px] bg-gray-900 rounded-[2.5rem] p-2 shadow-xl overflow-hidden border-[12px] border-gray-900">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-gray-900 rounded-b-xl z-10"></div>
                <div className="relative w-full h-full overflow-hidden rounded-[2rem]">
                  <img
                    src={Aro2}
                    alt="Booking Calendar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-[#062970] to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-sm font-medium">
                      Easily choose services and times that work for you
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 - Staggered Up */}
            <div className="flex flex-col items-center md:-translate-y-8 transition-transform">
              <div className="relative w-[250px] h-[500px] bg-gray-900 rounded-[2.5rem] p-2 shadow-xl overflow-hidden border-[12px] border-gray-900">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-gray-900 rounded-b-xl z-10"></div>
                <div className="relative w-full h-full overflow-hidden rounded-[2rem]">
                  <img
                    src={Aro3}
                    alt="Community View"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-[#062970] to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-sm font-medium">
                      Discuss beauty trends with your community and exchange recommendations
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 - Staggered Down */}
            <div className="flex flex-col items-center md:translate-y-8 transition-transform">
              <div className="relative w-[250px] h-[500px] bg-gray-900 rounded-[2.5rem] p-2 shadow-xl overflow-hidden border-[12px] border-gray-900">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-gray-900 rounded-b-xl z-10"></div>
                <div className="relative w-full h-full overflow-hidden rounded-[2rem]">
                  <img
                    src={Aro4}
                    alt="Show Off Looks"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-[#062970] to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-sm font-medium">
                      Show off your looks and get inspired by your network
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* About Section */}
      <section id="about" className="bg-[#f9fafb] py-16"> {/* Light gray background */}
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#062970] mb-8">
            About Us
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            ARO is your on-demand beauty connection. We provide seamless booking solutions for beauty professionals and their clients.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#062970] mb-8">
            Contact Us
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            Have questions? Reach out to us at <a href="mailto:info@aro.com" className="text-[#ddb2ef]">info@aro.com</a>.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;