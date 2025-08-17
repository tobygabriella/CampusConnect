import React, { useRef, useState } from "react";
import phones from "../../assets/phones.jpg";
import brianPage from "../../assets/Brian.png";
import sarahPage from "../../assets/Sarah.png";
import AroLogo from "@/assets/aro.png";
import api from "@/utils/axiosInstance";
import { toast } from "react-toastify";

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
    <div className="font-['Oswald'] text-[#010a4f] bg-white">
      {/* Header with Phone Image Side by Side */}
      <div className="flex flex-col md:flex-row items-center justify-center py-10 px-4 max-w-7xl mx-auto">
        <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0 md:pr-10">
          <img 
            src={AroLogo} 
            alt="Aro Logo" 
            className="h-16 md:h-24 lg:h-50 mx-auto md:mx-0 mb-4 transition-all duration-300" 
          />
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold">Campus looks, made easy</h2>
          <p className="text-lg md:text-xl mt-2">
            Find the right providers from your community.
          </p>
          <button
            onClick={scrollToForm}
            className="mt-6 bg-[#010a4f] text-white px-10 py-2 rounded-full hover:bg-[#023e8a] transition"
          >
            Join the waitlist
          </button>
        </div>
        
        <div className="md:w-1/2 flex justify-center">
          <img src={phones} alt="App preview on phones" className="max-w-xs md:max-w-md lg:max-w-lg" />
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-col md:flex-row justify-around px-4 text-center py-8">
        <div className="mb-6 md:mb-0">
          <h3 className="font-semibold">Find Service Providers with Ease</h3>
          <p className="text-sm text-[#555555]">
            Skip the hassle—rely on those you trust to discover new service providers quickly.
          </p>
        </div>
        <div className="mb-6 md:mb-0">
          <h3 className="font-semibold">Connect with your Community</h3>
          <p className="text-sm text-[#555555]">
            Engage, discuss, and get inspired by others' beauty and grooming experiences.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">All-in-One Management</h3>
          <p className="text-sm text-[#555555]">
            Seamlessly manage conversations, connections, appointments, and payments.
          </p>
        </div>
      </div>

      {/* Waitlist Form */}
      <div ref={formRef} className="py-10 px-6">
        <h2 className="text-3xl font-semibold text-center mb-4">
          Join the Waitlist
        </h2>
        <p className="text-center mb-6">
          Are you a student looking to book beauty services trusted by your campus? Or a provider ready to grow your client base?
          Sign up below to be the first to know when Aro launches near you.
        </p>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="firstName"
              placeholder="First Name"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="p-2 rounded border border-[#010a4f] bg-transparent placeholder-[#010a4f] outline-none"
            />
            <input
              name="lastName"
              placeholder="Last Name"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="p-2 rounded border border-[#010a4f] bg-transparent placeholder-[#010a4f] outline-none"
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="p-2 rounded border border-[#010a4f] bg-transparent placeholder-[#010a4f] outline-none"
          />
          <input
            name="school"
            placeholder="School (if applicable)"
            value={formData.school}
            onChange={handleChange}
            className="p-2 rounded border border-[#010a4f] bg-transparent placeholder-[#010a4f] outline-none"
          />
          <input
            name="cityState"
            placeholder="City, State"
            required
            value={formData.cityState}
            onChange={handleChange}
            className="p-2 rounded border border-[#010a4f] bg-transparent placeholder-[#010a4f] outline-none"
          />

          <select
            name="role"
            required
            value={formData.role}
            onChange={handleChange}
            className="p-2 rounded border border-[#010a4f] bg-transparent text-[#010a4f] outline-none"
          >
            <option value="" disabled>I am a...</option>
            <option value="student">Student</option>
            <option value="provider">Provider</option>
          </select>

          <button
            type="submit"
            className="mt-4 bg-[#010a4f] text-white px-6 py-2 rounded-full hover:bg-[#023e8a]"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Brian Page Image */}
      <div className="flex justify-center my-10">
        <img src={brianPage} alt="Brian Page Example" className="max-w-5xl w-full px-4" />
      </div>

      {/* Sarah Page Image */}
      <div className="flex justify-center my-10">
        <img src={sarahPage} alt="Sarah Page Example" className="max-w-5xl w-full px-4" />
      </div>
    </div>
  );
};

export default WaitlistPage;