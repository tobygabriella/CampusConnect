import {useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import api from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { Button } from "antd";

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const providerUsername = searchParams.get("provider");
  const serviceId = searchParams.get("service");
  const date = searchParams.get("date");
  const startTime = searchParams.get("start");
  const duration = searchParams.get("duration");
  const [cardError, setCardError] = useState("");


  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [serviceDetails, setServiceDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const parsedDuration = parseInt(duration, 10);
  const formattedDate = date ? dayjs(date).format("ddd, MMM D YYYY") : "";


  useEffect(() => {
    if (!providerUsername || !serviceId || !date || !startTime || !duration) {
      toast.error("Invalid or missing booking information.");
      navigate("/");
    }
  }, [providerUsername, serviceId, date, startTime, duration, navigate]);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await api.get(`/users/profile/${providerUsername}`);
        const service = res.data.services.find((s) => s.id === serviceId);
        setServiceDetails(service);
      } catch (err) {
        toast.error("Error loading service details");
      }
    };
    
    fetchService();
  }, [providerUsername, serviceId]);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const cardElement = elements.getElement(CardElement);
      const paymentMethod = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });
  
      if (paymentMethod.error) {
        setCardError(paymentMethod.error.message); // Show above button
        return setIsProcessing(false);
      }      
  
      const response = await api.post(
        "/payments/create-deposit",
        {
          providerUsername,
          serviceId,
          paymentMethodId: paymentMethod.paymentMethod.id,
          date,
          startTime,
          duration,
        },
        { withCredentials: true }
      );
  
      toast.success("Payment successful!");
      navigate(`/profile/${providerUsername}`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Something went wrong with your card.";
      setCardError(errorMsg); // update error display
      toast.error(errorMsg);  // optional
    }
     finally {
      setIsProcessing(false);
    }
  };
  

  const formatDate = (date) => dayjs(date).format("ddd, MMM D YYYY");

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-gradient-to-b from-[#f3e8ff] to-white p-6">
      <h2 className="text-2xl font-bold text-[#062970] mb-8">Complete Your Booking</h2>

      {/* Timeline */}
      <div className="flex justify-center items-center gap-8 mb-10 w-full max-w-2xl">
        {["Personal Details", "Payment", "Complete"].map((step, i) => (
          <div
            key={step}
            className={`flex flex-col items-center text-sm font-semibold ${i === 1 ? "text-[#062970]" : "text-gray-400"}`}
          >
            <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${i === 1 ? "bg-[#062970] text-white border-[#062970]" : "border-gray-400"}`}>
              {i + 1}
            </div>
            <span className="mt-2">{step}</span>
          </div>
        ))}
      </div>

      {/* Booking Summary Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold text-[#062970] mb-4">Booking Summary</h3>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-blue-700 font-medium">Your booking is on hold pending payment confirmation</p>
        </div>

        <div className="space-y-3 mb-6">
        <p className="flex justify-between items-start">
          <span className="text-gray-600">Service:</span>
          <span className="font-medium text-gray-600 text-right w-2/3 break-words">{serviceDetails?.name || "Loading..."}</span>
        </p>

          <p className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium text-gray-600">{formattedDate}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium text-gray-600">{startTime}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium text-gray-600">{parsedDuration / 60} hour(s)</span>
          </p>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-[#062970] mb-3">Payment Details</h4>
          <div className="border rounded-lg p-3 mb-4">
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#062970',
                  '::placeholder': {
                    color: '#a0aec0',
                  },
                },
              },
            }} />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="flex justify-between text-gray-600">
              <span>Service Price:</span>
              <span>${serviceDetails?.price || "0.00"}</span>
            </p>
            <p className="flex justify-between text-gray-600">
              <span>Deposit Amount:</span>
              <span className="font-bold text-[#062970]">${serviceDetails?.depositAmount || "0.00"}</span>
            </p>
          </div>
          {cardError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
              {cardError}
            </div>
          )}

          <Button
            onClick={handlePayment}
            disabled={!stripe || isProcessing}
            className="w-full bg-[#062970] text-white h-12 rounded-lg hover:bg-[#051f5c] transition-all duration-300 flex items-center justify-center"
            size="large"
          >
            {isProcessing ? "Processing..." : `Pay $${serviceDetails?.depositAmount || "0.00"}`}
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          By proceeding, you agree to our Terms & Conditions and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default CheckoutPage;
