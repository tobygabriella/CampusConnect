import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save } from "lucide-react";

export const EditableField = ({
  name,
  label,
  register,
  value,
  isEditing,
  onEdit,
  onSave,
  isTextarea = false,
  required = false,
  error,
  mode = "editable", 
}) => {
  const isEditMode = mode === "editable";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold text-[#062970]">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {isEditMode && !isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
          >
            <Edit2 size={16} />
          </Button>
        )}
        {isEditMode && isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSave}
            className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
          >
            <Save size={16} />
          </Button>
        )}
      </div>

      {isEditMode && !isEditing ? (
        <p className="p-2 bg-white rounded border border-transparent">
          {value || <span className="text-gray-400">Not provided</span>}
        </p>
      ) : isTextarea ? (
        <Textarea
          {...register(name)}
          className="h-32 bg-white text-[#062970] border-2 border-[#062970]"
        />
      ) : (
        <Input
          {...register(name)}
          className="bg-white text-[#062970] border-2 border-[#062970]"
        />
      )}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};


export default EditableField;