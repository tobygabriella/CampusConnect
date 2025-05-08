import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/Components/context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "@/utils/axiosInstance";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "react-toastify";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import ImageUploadSection from "../Profile/ImageUploadSection";

const CreateWorkPost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue } = useForm();
  const [files, setFiles] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

// Load services or appointments based on role
useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === "service_provider") {
          // Load both services and appointments for providers
          const [servicesRes, appointmentsRes] = await Promise.all([
            axios.get("/service-provider/details"),
            axios.get("/appointments") // Get all appointments
          ]);
          
          setServices(servicesRes.data.services || []);
          
          // Filter for only completed appointments
          const completedAppointments = appointmentsRes.data
            ?.filter(appt => appt.status === "completed") || [];
          setAppointments(completedAppointments);
        } else {
          // Load services for students
          const res = await axios.get("/services");
          setServices(res.data || []);
        }
      } catch (err) {
        console.error("Error fetching related data:", err);
      }
    };
  
    fetchData();
  }, [user]);

  const handleImageChange = (e) => {
    const filesArray = Array.from(e.target.files);
    const supported = filesArray.filter(file =>
        ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)
      );
    
      const rejected = filesArray.filter(file => !supported.includes(file));
    
      if (rejected.length > 0) {
        toast.error("Some files were not supported (e.g. HEIC). Please use JPG, PNG, or WebP.");
      }
    setFiles(prev => [...prev, ...supported]);
  };

  const removeNewImage = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("caption", data.caption);
    
    // Only append if value exists
    if (data.serviceId) formData.append("serviceId", data.serviceId);
    if (data.appointmentId) formData.append("appointmentId", data.appointmentId);
    
    files.forEach((file) => formData.append("images", file));

    try {
      setLoading(true);
      await axios.post("/work-posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Post created!");
      navigate("/profile");
    } catch (err) {
      console.error("Create post error:", err);
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-screen overflow-x-hidden">
      <SidebarNav onSearchToggle={() => setSearchVisible(!searchVisible)} />
      <div className="ml-64 min-h-screen bg-gradient-to-b from-[#f3e8ff] to-white flex flex-col flex-1 w-screen pt-16">
        <TopNavbar />

        <div className="max-w-4xl mx-auto p-4 md:p-8 w-full">
          <h1 className="text-3xl font-bold text-[#062970] mb-8">Create New Post</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Image Upload */}
            <ImageUploadSection
              title="Post Photos"
              existingImages={[]}
              newImages={files}
              onFileChange={(e) => handleImageChange(e)}
              onRemoveExisting={() => {}}
              onRemoveNew={removeNewImage}
              name="postImages"
            />

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption" className="text-lg font-semibold text-[#062970]">
                Caption
              </Label>
              <Textarea
                id="caption"
                {...register("caption", { required: true })}
                rows={4}
                className="bg-white text-[#062970] border-2 border-[#062970]"
              />
            </div>

            {/* Service/Appointment Dropdown */}
            {user?.role === "service_provider" ? (
              <>
                {/* Service dropdown for providers */}
                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-[#062970]">
                    Related Service (optional)
                  </Label>
                  <Select onValueChange={(value) => setValue("serviceId", value)}>
                    <SelectTrigger className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-[#062970] z-[100]">
                      {services.map((svc) => (
                        <SelectItem 
                          key={svc.id} 
                          value={svc.id}
                          className="text-[#062970] hover:bg-[#f3e8ff]"
                        >
                          {svc.name} (${svc.price}) — {svc.duration} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Appointment dropdown for providers */}
                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-[#062970]">
                    Related Appointment (optional)
                  </Label>
                  <Select onValueChange={(value) => setValue("appointmentId", value)}>
                    <SelectTrigger className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]">
                      <SelectValue placeholder="Select an appointment" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-[#062970] z-[100]">
                      {appointments.map((apt) => (
                        <SelectItem 
                          key={apt.id} 
                          value={apt.id}
                          className="text-[#062970] hover:bg-[#f3e8ff]"
                        >
                          {new Date(apt.startTime).toLocaleString()} — {apt.service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              /* Service dropdown for students */
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-[#062970]">
                  Related Service (optional)
                </Label>
                <Select onValueChange={(value) => setValue("serviceId", value)}>
                  <SelectTrigger className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-[#062970] z-[100]">
                    {services.map((svc) => (
                      <SelectItem 
                        key={svc.id} 
                        value={svc.id}
                        className="text-[#062970] hover:bg-[#f3e8ff]"
                      >
                        {svc.name} (${svc.price}) — {svc.duration} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                disabled={loading || files.length === 0}
              >
                {loading ? "Posting..." : "Create Post"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkPost;