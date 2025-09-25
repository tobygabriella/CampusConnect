import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import api from "@/utils/axiosInstance";
import defaultProfile from "@/assets/default-profile.jpg";
import { Button } from "@/components/ui/button";
import { CameraIcon } from "lucide-react";
import { BasicInfoSection } from "./BasicInfoSection";
import { CollegeInfoSection } from "./CollegeInfoSection";
import { ServiceProviderSection } from "./ServiceProviderSection";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import { toast } from "react-toastify";
import useUsernameAvailability from "@/hooks/useUsernameAvailability";
import ProfessionSelect from "@/Components/Onboarding/ProfessionSelect";
import { getCombinedSchema } from "@/utils/schema";
import { formatRoleName } from "@/utils/formatters";

export const EditProfileForm = () => {
  const { user, verifyAuth } = useAuth();
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profilePicture || defaultProfile);
  const [workImages, setWorkImages] = useState([]);
  const [certificationImages, setCertificationImages] = useState([]);
  const [existingWorkImages, setExistingWorkImages] = useState([]);
  const [existingCertifications, setExistingCertifications] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparingSwitch, setIsPreparingSwitch] = useState(false);
  const [removedWork, setRemovedWork] = useState([]);
  const [removedCert, setRemovedCert] = useState([]);

  const fileChangesExist = (
    profilePicture !== null ||
    workImages.length > 0 ||
    certificationImages.length > 0 ||
    removedWork.length > 0 ||
    removedCert.length > 0
  );

  

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(getCombinedSchema(user?.role, isPreparingSwitch)),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services",
  });

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "role") {
        reset({ ...value }, { keepValues: true, keepDirty: true }); // keep current values
      }
    });
    return () => subscription.unsubscribe?.();
  }, [watch, reset, isPreparingSwitch]);
  

  const role = watch("role", user?.role);
  const watchedUsername = watch("username");
  const initialUsername = user?.username;

  const { isAvailable, error: usernameError } = useUsernameAvailability(watchedUsername, initialUsername);

  // Load profile data when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const response = await api.get(`/users/profile/${user.username}`);
        const profileData = response.data;
  
        // Reset the form with all fields at once
        reset({
          name: profileData.name,
          username: profileData.username,
          college: profileData.collegeId,
          collegesServed: profileData.collegesServedIds,
          role: profileData.role,
          profession: profileData.profession || "",
          biography: profileData.biography || "",
          experience: profileData.experience || "",
          location: profileData.location || "",
          policy: profileData.policy || "",
          cancellationWindow: profileData.cancellationWindow || "24",
          rescheduleFee: profileData.rescheduleFee || "0",
          services: profileData.services?.map(service => ({
            id: service.id,
            name: service.name,
            price: service.price.toString(),
            duration: service.duration.toString(),
            depositAmount: service.depositAmount?.toString() || "0"
          })) || [],
        });
  
        // Set service provider images if applicable
        if (profileData.role === "service_provider") {
          setExistingWorkImages(profileData.workImages || []);
          setExistingCertifications(profileData.certificationImages || []);
        }
  
        // Set profile picture
        setImagePreview(profileData.profilePicture || defaultProfile);
  
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (user?.username) {
      loadProfileData();
    }
  }, [user?.username, reset]);
  

  const onSubmit = async (data) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      
      // Append basic info
      formData.append("name", data.name);
      formData.append("username", data.username);
      if (data.college) formData.append("college", data.college);
      formData.append("collegesServed", JSON.stringify(data.collegesServed || []));
      
      // Append profile picture if changed
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }
      
      // Append service provider data if applicable
      if (role === "service_provider") {
        formData.append("profession", data.profession);
        formData.append("biography", data.biography);
        formData.append("experience", data.experience);
        formData.append("location", data.location);
        formData.append("policy", data.policy);
        formData.append("services", JSON.stringify(data.services));
        formData.append("rescheduleFee", data.rescheduleFee || "0");
        // Get removed images by comparing existing with what's kept
        formData.append("removedWorkImages", JSON.stringify(removedWork));
        formData.append("removedCertifications", JSON.stringify(removedCert));
        // Append new files
        workImages.forEach(file => formData.append("workImages", file));
        certificationImages.forEach(file => formData.append("certificationImages", file));
      }
      
      // Submit to API
      await api.put("/users/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Refresh auth data
      await verifyAuth();
      navigate(`/profile/${data.username}`);
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files).filter(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return false;
      }
      // Validate file size (e.g., 5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return false;
      }
      return true;
    }); // Get all selected files
    if (!files.length) return;
    
    if (type === 'profile') {
      // For profile picture, only take the first file
      setProfilePicture(files[0]);
      setImagePreview(URL.createObjectURL(files[0]));
    } else if (type === 'work') {
      setWorkImages(prev => [...prev, ...files]); // Add all new files
    } else if (type === 'certification') {
      setCertificationImages(prev => [...prev, ...files]); // Add all new files
    }
  };

  const removeWorkImage = (index, isExisting = false) => {
    if (isExisting) {
      setRemovedWork(prev => [...prev, existingWorkImages[index]]);
      setExistingWorkImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setWorkImages(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const removeCertification = (index, isExisting = false) => {
    if (isExisting) {
      setRemovedCert(prev => [...prev, existingCertifications[index]]);
      setExistingCertifications(prev => prev.filter((_, i) => i !== index));
    } else {
      setCertificationImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  if (isLoading) {
    return <div className="text-center text-[#010a4f] mt-10">Loading profile data...</div>;
  }

  return (
    <div className="flex w-screen overflow-x-hidden">
      <SidebarNav />
      <div className="flex-1 bg-gradient-to-b from-white to-[#f5f5f5] flex flex-col pt-16 min-h-screen overflow-y-auto ml-16 min-[850px]:ml-64 p-4 lg-custom:p-8 transition-all duration-300">
        <TopNavbar />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img 
                src={imagePreview} 
                alt="Profile Preview" 
                className="w-full h-full object-cover"
              />
              <label 
                htmlFor="profileUpload" 
                className="absolute bottom-0 w-full h-1/3 bg-black bg-opacity-50 flex justify-center items-center cursor-pointer"
              >
                <CameraIcon size={18} className="text-white" />
              </label>
            </div>
            <input 
              id="profileUpload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFileChange(e, 'profile')}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => document.getElementById('profileUpload').click()}
            >
              Change Photo
            </Button>
          </div>

          {/* Role Switch */}
          <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow border border-gray-200">
            <div>
              <h3 className="font-semibold text-[#062970]">
                Current Role: <span>{formatRoleName(role)}</span>
              </h3>
              {user?.role === "student" && !isPreparingSwitch && (
                <p className="text-sm text-[#010a4f] mt-1">
                  Switch to {formatRoleName("service_provider")} to offer services
                </p>
              )}
              {user?.role === "student" && !isPreparingSwitch && (
                <Button
                  className="mt-2 !bg-transparent text-[#062970] hover:!bg-[#f3e8ff]"
                  onClick={() => {
                    setIsPreparingSwitch(true);
                    setValue("role", "service_provider", { shouldDirty: true }); // Temporary UI update
                  }}
                  style={{ color: "#062970"}}
                >
                  Switch to {formatRoleName("service_provider")}
                </Button>
              )}
            </div>
          </div>


          <BasicInfoSection
            register={register}
            errors={errors}
            editingField={editingField}
            setEditingField={setEditingField}
            watch={watch}
            isAvailable={isAvailable}
            usernameError={usernameError}
          />

          <CollegeInfoSection
            role={role}
            watch={watch}
            setValue={setValue}
          />

          {(role === "service_provider"|| isPreparingSwitch) && (
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
              editingField={editingField}
              setEditingField={setEditingField}
              watch={watch}
              setValue={setValue}
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              existingWorkImages={existingWorkImages}
              existingCertifications={existingCertifications}
              workImages={workImages}
              certificationImages={certificationImages}
              handleFileChange={handleFileChange}
              removeWorkImage={removeWorkImage}
              removeCertification={removeCertification}
            />
          )}
          {isPreparingSwitch && (
            <div className="text-red-600 text-sm font-semibold">
              ⚠️ Switching to a service provider is permanent and cannot be undone.
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="text-[#062970] !bg-transparent hover:!bg-[#f3e8ff] border border-[#062970]"
              onClick={() => navigate(-1)}
              style={{ color: "#062970"}}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-[#062970] !bg-transparent hover:!bg-[#f3e8ff] border border-[#062970]"
              disabled={
                isUploading || 
                (watchedUsername && isAvailable === false && watchedUsername !== initialUsername) || 
                (!isDirty && !fileChangesExist)
              }
              style={{ color: "#062970"}}
            >
              {isUploading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileForm;