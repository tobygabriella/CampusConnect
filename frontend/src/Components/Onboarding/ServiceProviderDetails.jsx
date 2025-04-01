import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import { Trash2Icon, PlusCircleIcon, DollarSign, Clock } from "lucide-react";
import api from "@/utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "/Users/tobygabriella/Desktop/Aro/frontend/src/Components/context/AuthContext.jsx";

const schema = z.object({
  profession: z.string().min(1, "Profession is required"),
  services: z.array(
    z.object({
      name: z.string().min(1, "Service name required"),
      price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price"),
      duration: z.string().regex(/^\d+$/, "Duration must be a number"),
    })
  ).min(1, "At least one service is required"),
  policy: z.string().optional(),
  biography: z.string().optional(),
  experience: z.string().optional(),
  location: z.string().optional(),
});

const ServiceProviderDetails = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workImages, setWorkImages] = useState([]);
  const [certificationImages, setCertificationImages] = useState([]);
  const navigate = useNavigate();
  const { verifyAuth } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      services: [{ name: "", price: "", duration: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services",
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get("/service-provider/details", { withCredentials: true });

        if (response.data) {
          const { services, workImages, certificationImages, ...rest } = response.data;
          // Set form values
          Object.keys(rest).forEach((key) => {
            setValue(key, rest[key]);
          });
          // Set services
          setValue('services', services.map(s => ({
            name: s.name,
            price: s.price.toString(),
            duration: s.duration.toString()
          })));
          // Set images
          setWorkImages(workImages || []);
          setCertificationImages(certificationImages || []);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error("Error loading details");
        }
      }
    };
    fetchDetails();
  }, [setValue]);

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
      formData.append('services', JSON.stringify(data.services.map(s => ({
        name: s.name,
        price: parseFloat(s.price),
        duration: parseInt(s.duration)
      }))));
      formData.append('policy', data.policy || '');
      formData.append('biography', data.biography || '');
      formData.append('experience', data.experience || '');
      formData.append('location', data.location || '');

      // Add files
      workImages.forEach(file => {
        formData.append('workImages', file);
      });
      certificationImages.forEach(file => {
        formData.append('certificationImages', file);
      });

      const response = await api.post("/service-provider/details", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }, { withCredentials: true });
      toast.success("Details saved successfully!");
      await verifyAuth();
      navigate("/profile"); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving details");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-gradient-to-b from-[#f3e8ff] to-white">
      <div className="w-full max-w-4xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#062970]">Complete Your Profile</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Profession Selection */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-[#062970]">Profession</Label>
            <Select onValueChange={value => setValue('profession', value)}>
              <SelectTrigger className="w-full p-3 bg-white border-2 border-[#062970] rounded-lg focus:border-[#062970]">
                <SelectValue placeholder="Select your profession" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white border-2 border-[#062970] z-[100]">
                <SelectItem value="hairstylist" className="text-[#062970] hover:bg-[#f3e8ff]">Hairstylist</SelectItem>
                <SelectItem value="barber" className="text-[#062970] hover:bg-[#f3e8ff]">Barber</SelectItem>
                <SelectItem value="makeup" className="text-[#062970] hover:bg-[#f3e8ff]">Makeup Artist</SelectItem>
                <SelectItem value="nails" className="text-[#062970] hover:bg-[#f3e8ff]">Nail Technician</SelectItem>
              </SelectContent>
            </Select>
            {errors.profession && (
              <p className="text-red-500 text-sm">{errors.profession.message}</p>
            )}
          </div>

          {/* Services Section */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-[#062970]">Services Offered</Label>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border-2 border-[#062970] rounded-lg bg-white">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <Label className="text-[#062970]">Service Name</Label>
                      <Input
                        {...register(`services.${index}.name`)}
                        placeholder="e.g., Haircut, Styling"
                        className="mt-1 border-2 border-[#062970] text-[#062970] placeholder:text-gray-500"
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-[#062970]">Price</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-[#062970]" />
                        <Input
                          {...register(`services.${index}.price`)}
                          placeholder="0.00"
                          className="pl-9 border-2 border-[#062970] text-[#062970]"
                        />
                      </div>
                    </div>
                    <div className="w-32">
                      <Label className="text-[#062970]">Duration</Label>
                      <div className="relative mt-1">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-[#062970]" />
                        <Input
                          {...register(`services.${index}.duration`)}
                          placeholder="mins"
                          type="number"
                          className="pl-9 border-2 border-[#062970] text-[#062970]"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-7 hover:bg-red-50"
                    >
                      <Trash2Icon className="h-5 w-5 text-red-500 hover:text-red-700" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: "", price: "", duration: "" })}
                className="w-full py-3 border-2 border-[#062970] text-white. hover:bg-[#f3e8ff]"
              >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Add Another Service
              </Button>
            </div>
          </div>

          {/* Text Fields */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-lg font-semibold text-[#062970]">Policy/Additional Details</Label>
              <Textarea
                {...register("policy")}
                className="h-32 bg-white text-[#062970] border-2 border-[#062970]"
                placeholder="Enter your booking policy and additional information"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-lg font-semibold text-[#062970]">Biography</Label>
              <Textarea
                {...register("biography")}
                className="h-32 bg-white text-[#062970] border-2 border-[#062970]"
                placeholder="Tell clients about yourself"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-semibold text-[#062970]">Experience</Label>
            <Textarea
              {...register("experience")}
              className="h-32 bg-white text-[#062970] border-2 border-[#062970]"
              placeholder="Describe your professional experience"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-semibold text-[#062970]">Location</Label>
            <Input
              {...register("location")}
              className="bg-white text-[#062970] border-2 border-[#062970]"
              placeholder="Enter your work location"
            />
            <p className="text-sm text-gray-600 italic">
              Note: Your location will only be visible after a client books
            </p>
          </div>

          {/* Image Upload Sections */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-lg font-semibold text-[#062970]">Work Portfolio</Label>
              <div className="p-6 border-2 border-[#062970] rounded-lg bg-white">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-[#062970] border-dashed rounded-lg cursor-pointer bg-[#f3e8ff] hover:bg-[#e0d7f5]">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PlusCircleIcon className="w-8 h-8 mb-4 text-[#062970]" />
                      <p className="mb-2 text-sm text-[#062970]"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-[#062970]">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <Input
                      type="file"
                      onChange={e => handleFileChange(e, 'workImages')}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                </div>
                {workImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-[#062970]">
                      {workImages.length} images selected
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.from({ length: workImages.length }).map((_, i) => (
                        <div key={i} className="w-12 h-12 bg-[#f3e8ff] rounded-lg flex items-center justify-center">
                          <span className="text-xs text-[#062970] font-medium">IMG</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-semibold text-[#062970]">Certifications</Label>
              <div className="p-6 border-2 border-[#062970] rounded-lg bg-white">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-[#062970] border-dashed rounded-lg cursor-pointer bg-[#f3e8ff] hover:bg-[#e0d7f5]">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PlusCircleIcon className="w-8 h-8 mb-4 text-[#062970]" />
                      <p className="mb-2 text-sm text-[#062970]"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-[#062970]">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <Input
                      type="file"
                      onChange={e => handleFileChange(e, 'certificationImages')}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                </div>
                {certificationImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-[#062970]">
                      {certificationImages.length} images selected
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.from({ length: certificationImages.length }).map((_, i) => (
                        <div key={i} className="w-12 h-12 bg-[#f3e8ff] rounded-lg flex items-center justify-center">
                          <span className="text-xs text-[#062970] font-medium">IMG</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 text-lg font-semibold bg-[#062970] hover:bg-[#051f5c] text-white"
          >
            {isSubmitting ? "Saving..." : "Complete Profile Setup"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ServiceProviderDetails;