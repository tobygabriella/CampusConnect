import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import api from "@/utils/axiosInstance";
import defaultProfile from "@/assets/default-profile.jpg";
import { Button } from "@/components/ui/button";
import { CameraIcon } from "lucide-react";
import { BasicInfoSection } from "./BasicInfoSection";
import { CollegeInfoSection } from "./CollegeInfoSection";
import { ServiceProviderSection } from "./ServiceProviderSection";

// Create separate schemas for different roles
const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  college: z.string().optional(),
  collegesServed: z.array(z.string()).optional(),
});

const serviceProviderSchema = z.object({
  profession: z.string().min(1, "Profession is required"),
  biography: z.string().min(1, "Biography is required"),
  experience: z.string().min(1, "Experience is required"),
  location: z.string().min(1, "Location is required"),
  policy: z.string().min(1, "Policy is required"),
  services: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, "Service name required"),
      price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price"),
      duration: z.string().regex(/^\d+$/, "Duration must be a number"),
    })
  ).min(1, "At least one service is required"),
});

export const EditProfileForm = () => {
  const { user, verifyAuth } = useAuth();
  const username = user?.username;
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profilePicture || defaultProfile);
  const [workImages, setWorkImages] = useState([]);
  const [certificationImages, setCertificationImages] = useState([]);
  const [existingWorkImages, setExistingWorkImages] = useState([]);
  const [existingCertifications, setExistingCertifications] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [usernameError, setUsernameError] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic schema based on role
  const schema = user?.role === "service_provider" 
    ? baseSchema.merge(serviceProviderSchema) 
    : baseSchema;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services",
  });

  const role = watch("role", user?.role);

  // Load profile data when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const response = await api.get(`/users/profile/${user.username}`);
        const profileData = response.data;
        
        // Set basic user info
        reset({
          name: profileData.name,
          username: profileData.username,
          college: profileData.college || "",
          collegesServed: profileData.collegesServed || [],
          role: profileData.role,
        });

        // Set service provider data if applicable
        if (profileData.role === "service_provider") {
          setValue("profession", profileData.profession || "");
          setValue("biography", profileData.biography || "");
          setValue("experience", profileData.experience || "");
          setValue("location", profileData.location || "");
          setValue("policy", profileData.policy || "");
          
          // Set services
          if (profileData.services) {
            setValue("services", profileData.services.map(service => ({
              id: service.id,
              name: service.name,
              price: service.price.toString(),
              duration: service.duration.toString(),
            })));
          }
          
          // Set existing images
          setExistingWorkImages(profileData.workImages || []);
          setExistingCertifications(profileData.certificationImages || []);
        }

        // Set profile picture
        if (profileData.profilePicture) {
          setImagePreview(profileData.profilePicture);
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.username) {
      loadProfileData();
    }
  }, [user?.username, reset, setValue]);

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
        
        // Append new work images
        workImages.forEach((file, index) => {
          formData.append(`workImages`, file);
        });
        
        // Append new certification images
        certificationImages.forEach((file, index) => {
          formData.append(`certificationImages`, file);
        });
        
        // Append removed images
        formData.append("removedWorkImages", JSON.stringify(
          existingWorkImages.filter(img => !data.workImages?.includes(img))
        ));
        formData.append("removedCertifications", JSON.stringify(
          existingCertifications.filter(img => !data.certificationImages?.includes(img))
        ));
      }
      
      // Submit to API
      await axios.put("/api/profile/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Refresh auth data
      await verifyAuth();
      navigate(`/profile/${data.username}`);
    } catch (error) {
      console.error("Profile update failed:", error);
      // Handle error
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (type === 'profile') {
      setProfilePicture(file);
      setImagePreview(URL.createObjectURL(file));
    } else if (type === 'work') {
      setWorkImages(prev => [...prev, file]);
    } else if (type === 'certification') {
      setCertificationImages(prev => [...prev, file]);
    }
  };

  const removeWorkImage = (index) => {
    setWorkImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeCertification = (index) => {
    setCertificationImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRoleSwitch = async () => {
    setIsSwitchingRole(true);
    try {
      const newRole = role === "student" ? "service_provider" : "student";
      await axios.post("/api/profile/switch-role", { role: newRole });
      await verifyAuth();
      // Reset form with new role
      reset({
        ...watch(),
        role: newRole,
      });
    } catch (error) {
      console.error("Role switch failed:", error);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  if (isLoading) {
    return <div>Loading profile data...</div>;
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-[#f3e8ff] to-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-[#062970] mb-8">Edit Profile</h1>
        
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
          <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
            <div>
              <h3 className="font-semibold text-[#062970]">
                Current Role: <span className="capitalize">{role}</span>
              </h3>
              <p className="text-sm text-gray-600">
                {role === "student" 
                  ? "Switch to service provider to offer services"
                  : "Switch back to student if you no longer want to offer services"}
              </p>
            </div>
            <Button
              type="button"
              onClick={handleRoleSwitch}
              disabled={isSwitchingRole}
              className="bg-[#062970] hover:bg-[#051f5c] text-white"
            >
              {isSwitchingRole ? "Processing..." : `Switch to ${role === "student" ? "Service Provider" : "Student"}`}
            </Button>
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

          {role === "service_provider" && (
            <ServiceProviderSection
              register={register}
              errors={errors}
              editingField={editingField}
              setEditingField={setEditingField}
              watch={watch}
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

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="text-[#062970] border-[#062970]"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#062970] hover:bg-[#051f5c] text-white"
              disabled={isUploading || (username && isAvailable === false) || !isDirty}
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