import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import { EditableField } from "./EditableField";

export const BasicInfoSection = ({
  register,
  errors,
  editingField,
  setEditingField,
  watch,
  isAvailable,
  usernameError
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <EditableField
        name="name"
        label="Full Name"
        register={register}
        value={watch("name")}
        isEditing={editingField === "name"}
        onEdit={() => setEditingField("name")}
        onSave={() => setEditingField(null)}
        required
        error={errors.name?.message}
      />
      
      <div className="space-y-2">
        <Label className="text-lg font-semibold text-[#062970]">Username</Label>
        <div className="relative">
          <Input
            {...register("username")}
            className="bg-white text-[#062970] border-2 border-[#062970]"
            placeholder="Your username"
          />
          {isAvailable === true && (
            <span className="absolute right-2 top-2 text-green-500">
              <Check size={20} />
            </span>
          )}
          {isAvailable === false && (
            <span className="absolute right-2 top-2 text-red-500">
              <X size={20} />
            </span>
          )}
        </div>
        {isAvailable === true && (
          <p className="text-green-500 text-sm flex items-center">
            <Check className="mr-1" size={16} /> Username available
          </p>
        )}
        {isAvailable === false && (
          <p className="text-red-500 text-sm flex items-center">
            <X className="mr-1" size={16} /> {usernameError}
          </p>
        )}
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username.message}</p>
        )}
      </div>
    </div>
  );
};

export default BasicInfoSection;