import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/Components/context/AuthContext";
import axios from "@/utils/axiosInstance";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "react-toastify";
import ImageUploadSection from "../Profile/ImageUploadSection";
import Loading from "@/Components/Loading/LoadingState";
import { X, ImagePlus, Camera, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";
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
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
            onClick={handleClose}
          />
          
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg w-full max-w-lg border border-gray-100 overflow-hidden max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <ImagePlus className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Create Work Post</h2>
                    {user && (
                      <div className="flex items-center gap-1 mt-1">
                        <Camera className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Share your recent work
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <ModernButton
                  variant="ghost"
                  size="sm"
                  className="!p-2"
                  onClick={handleClose}
                  rounded="full"
                >
                  <X className="h-5 w-5" />
                </ModernButton>
              </div>

        {/* Content */}
              <div className="p-5">
                {loading ? (
                  <Loading />
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Image Upload */}
                    <div className="mb-5">
                      <Label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Camera className="h-4 w-4 text-gray-500" />
                          <span>Add Photos</span>
                        </div>
                      </Label>
                      <ImageUploadSection
                        title=""
                        existingImages={[]}
                        newImages={files}
                        onFileChange={(e) => handleImageChange(e)}
                        onRemoveExisting={() => {}}
                        onRemoveNew={removeNewImage}
                        name="postImages"
                      />
                      {files.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1.5">
                          Please add at least one photo to create a work post.
                        </p>
                      )}
                    </div>

                    {/* Caption */}
                    <div className="space-y-2">
                      <Label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <ImagePlus className="h-4 w-4 text-gray-500" />
                          <span>Caption</span>
                        </div>
                      </Label>
                      <Textarea
                        id="caption"
                        {...register("caption", { required: true })}
                        rows={3}
                        className="input-modern w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 placeholder-gray-400 bg-white transition-all shadow-sm"
                        placeholder="Describe your work..."
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    {/* Service/Appointment Dropdown */}
                    {user?.role === "service_provider" ? (
                      <>
                        {/* Service dropdown for providers */}
                        <div className="space-y-2">
                          <Label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>Related Service (optional)</span>
                            </div>
                          </Label>
                          <Select onValueChange={(value) => setValue("serviceId", value)}>
                            <SelectTrigger className="input-modern w-full p-3 border border-gray-200 rounded-lg h-[42px] text-gray-800">
                              <SelectValue placeholder="Select a service"/>
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm z-[100] overflow-hidden">
                              {services.map((svc) => (
                                <SelectItem 
                                  key={svc.id} 
                                  value={svc.id}
                                  className="text-gray-800 hover:bg-blue-50"
                                >
                                  {svc.name} (${svc.price}) — {svc.duration} min
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Appointment dropdown for providers */}
                        <div className="space-y-2">
                          <Label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>Related Appointment (optional)</span>
                            </div>
                          </Label>
                          <Select onValueChange={(value) => setValue("appointmentId", value)}>
                            <SelectTrigger className="input-modern w-full p-3 border border-gray-200 rounded-lg h-[42px] text-gray-800">
                              <SelectValue placeholder="Select an appointment" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm z-[100] overflow-hidden">
                              {appointments.map((apt) => (
                                <SelectItem 
                                  key={apt.id} 
                                  value={apt.id}
                                  className="text-gray-800 hover:bg-blue-50"
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
                        <Label className="block text-sm font-medium text-gray-700 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>Related Service (optional)</span>
                          </div>
                        </Label>
                        <Select onValueChange={(value) => setValue("serviceId", value)}>
                          <SelectTrigger className="input-modern w-full p-3 border border-gray-200 rounded-lg h-[42px] text-gray-800">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm z-[100] overflow-hidden">
                            {services.map((svc) => (
                              <SelectItem 
                                key={svc.id} 
                                value={svc.id}
                                className="text-gray-800 hover:bg-blue-50"
                              >
                                {svc.name} (${svc.price}) — {svc.duration} min
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                      <ModernButton
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={handleClose}
                      >
                        Cancel
                      </ModernButton>
                      
                      <ModernButton
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={loading || files.length === 0 || submitting}
                      >
                        {submitting ? <Loading inline={true} /> : "Create Post"}
                      </ModernButton>
                    </div>
            </form>
          )}
        </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

CreateWorkPost.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPostCreated: PropTypes.func,
};

export default CreateWorkPost;