import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import api from "@/utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import ServiceProviderSection from "@/Components/Profile/ServiceProviderSection";
import ProfessionSelect from "@/components/Onboarding/ProfessionSelect";
import { serviceProviderSchema } from "@/utils/schema";
import Loading from "@/Components/Loading/LoadingState";

const ServiceProviderDetails = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workImages, setWorkImages] = useState([]);
  const [certificationImages, setCertificationImages] = useState([]);
  const [existingWorkImages, setExistingWorkImages] = useState([]);
  const [existingCertifications, setExistingCertifications] = useState([]);
  const navigate = useNavigate();
  const { verifyAuth } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(serviceProviderSchema),
    defaultValues: {
      services: [{ name: "", price: "", duration: "", depositAmount: "" }],
      cancellationWindow: "24",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services",
  });

  // Load existing data if available
  useEffect(() => {
    const fetchServiceProviderDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/service-provider/details");
        const data = response.data;
        
        if (data) {
          reset({
            profession: data.profession || "",
            biography: data.biography || "",
            experience: data.experience || "",
            location: data.location || "",
            policy: data.policy || "",
            cancellationWindow: data.cancellationWindow?.toString() || "24",
            services: data.services?.map(service => ({
              name: service.name,
              price: service.price.toString(),
              duration: service.duration.toString(),
              depositAmount: service.depositAmount?.toString() || "0"
            })) || [{ name: "", price: "", duration: "", depositAmount: "" }]
          });

          setExistingWorkImages(data.workImages || []);
          setExistingCertifications(data.certificationImages || []);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error("Failed to load service provider details");
          console.error("Error fetching service provider details:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceProviderDetails();
  }, [reset]);

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'workImages') {
      setWorkImages(prev => [...prev, ...files]);
    } else {
      setCertificationImages(prev => [...prev, ...files]);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      
      // Add text data
      formData.append('profession', data.profession);
      formData.append('services', JSON.stringify(
        data.services.map(s => ({
          name: s.name,
          price: parseFloat(s.price),
          duration: parseInt(s.duration),
          depositAmount: parseFloat(s.depositAmount),
        }))
      ));
      formData.append('policy', data.policy);
      formData.append('cancellationWindow', data.cancellationWindow);
      formData.append('biography', data.biography);
      formData.append('experience', data.experience);
      formData.append('location', data.location);
      formData.append('rescheduleFee', data.rescheduleFee || "0");

      // Add files
      workImages.forEach(file => formData.append('workImages', file));
      certificationImages.forEach(file => formData.append('certificationImages', file));

      // Add removed images
      formData.append('removedWorkImages', JSON.stringify(
        existingWorkImages.filter(img => !watch("workImages")?.includes(img))
      ));
      formData.append('removedCertifications', JSON.stringify(
        existingCertifications.filter(img => !watch("certificationImages")?.includes(img))
      ));

      // Determine if we're creating or updating
      const method = existingWorkImages.length > 0 || existingCertifications.length > 0 ? 
        api.put : api.post;

      const response = await method("/service-provider/details", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success("Service provider details saved successfully!");
      await verifyAuth();
      navigate("/profile");
    } catch (error) {
      console.error("Error saving service provider details:", error);
      toast.error(error.response?.data?.message || "Failed to save details");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-gradient-to-b from-[#f3e8ff] to-white">
      <div className="w-full max-w-4xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#062970]">
          {existingWorkImages.length > 0 ? "Update Your Profile" : "Complete Your Profile"}
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <ServiceProviderSection
            ProfessionInput={
              <ProfessionSelect
                value={watch("profession")}
                onChange={(val) => setValue("profession", val, { shouldDirty: true })}
                error={errors.profession?.message}
              />
            }
            register={register}
            errors={errors}
            editingField={null}
            control={control}
            setEditingField={() => {}}
            watch={watch}
            fields={fields}
            append={append}
            remove={remove}
            setValue={setValue}
            existingWorkImages={existingWorkImages}
            existingCertifications={existingCertifications}
            workImages={workImages}
            certificationImages={certificationImages}
            handleFileChange={handleFileChange}
            removeWorkImage={(index) => {
              if (index < existingWorkImages.length) {
                // Remove existing image
                setExistingWorkImages(prev => prev.filter((_, i) => i !== index));
              } else {
                // Remove new image
                setWorkImages(prev => prev.filter((_, i) => i !== (index - existingWorkImages.length)));
              }
            }}
            removeCertification={(index) => {
              if (index < existingCertifications.length) {
                setExistingCertifications(prev => prev.filter((_, i) => i !== index));
              } else {
                setCertificationImages(prev => prev.filter((_, i) => i !== (index - existingCertifications.length)));
              }
            }}
            mode="input"
          />

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || !isDirty}
              className="bg-[#062970] text-white hover:bg-[#051d5c]"
            >
              {isSubmitting ?<Loading inline={true} /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceProviderDetails;