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
    <div className="grid gap-6 md:grid-cols-2 text-[#062970]">
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
        <EditableField
          name="username"
          label="Username"
          register={register}
          value={watch("username")}
          isEditing={editingField === "username"}
          onEdit={() => setEditingField("username")}
          onSave={() => setEditingField(null)}
          required
          error={errors.username?.message}
        />
        
        <div className="ml-2">
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
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;