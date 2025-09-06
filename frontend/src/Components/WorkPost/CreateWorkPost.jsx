import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/Components/context/AuthContext";
import axios from "@/utils/axiosInstance";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "react-toastify";
import ImageUploadSection from "../Profile/ImageUploadSection";
import Loading from "@/Components/Loading/LoadingState";
import { X } from "lucide-react";
import PropTypes from 'prop-types';

const CreateWorkPost = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth();
  const { register, handleSubmit, setValue, reset } = useForm();
  const [files, setFiles] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load services or appointments based on role
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
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
      finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [user, isOpen]);

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
      setSubmitting(true);
      const response = await axios.post("/work-posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Post created!");
      
      // Reset form and close modal
      reset();
      setFiles([]);
      onClose();
      
      // Notify parent component if callback provided
      if (onPostCreated) {
        onPostCreated(response.data);
      }
    } catch (err) {
      console.error("Create post error:", err);
      toast.error("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10 p-4">
      <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-[#062970]">Create New Post</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <Loading />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                rows={1}
                className="bg-white text-[#062970] border border-[#062970]/70 rounded-full shadow-sm px-4 py-2 min-h-[42px] focus:border-[#062970] focus:ring-1 focus:ring-[#062970]/30 transition-all"
                style={{ resize: 'vertical' }}
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
                    <SelectTrigger className="!bg-transparent hover:!bg-[#f3e8ff]/50 border border-[#062970]/70 rounded-full shadow-sm h-[42px] px-4 text-[#062970] [&>span]:text-[#062970] transition-all">
                      <SelectValue placeholder="Select a service"/>
                    </SelectTrigger>
                    <SelectContent className="bg-white border text-[#062970] border-[#062970]/70 rounded-2xl shadow-sm z-[100] overflow-hidden">
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
                    <SelectTrigger className="!bg-transparent hover:!bg-[#f3e8ff]/50 border border-[#062970]/70 rounded-full shadow-sm h-[42px] px-4 text-[#062970] [&>span]:text-[#062970] transition-all">
                      <SelectValue placeholder="Select an appointment" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-[#062970]/70 rounded-2xl shadow-sm z-[100] overflow-hidden">
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
                  <SelectTrigger className="!bg-transparent hover:!bg-[#f3e8ff]/50 text-[#062970] border border-[#062970]/70 rounded-full shadow-sm h-[42px] px-4 transition-all">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#062970]/70 rounded-2xl shadow-sm z-[100] overflow-hidden">
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
                  className="!bg-transparent hover:!bg-[#f3e8ff] !text-[#062970] border-2 border-[#062970]"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="!bg-[#062970] hover:!bg-[#051f5c] !text-white"
                  disabled={loading || files.length === 0 || submitting}
                >
                   {submitting ? <Loading inline={true} /> : "Create Post"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

CreateWorkPost.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPostCreated: PropTypes.func,
};

export default CreateWorkPost;