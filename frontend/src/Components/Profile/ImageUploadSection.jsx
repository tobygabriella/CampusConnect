import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlusCircleIcon, X } from "lucide-react";

export const ImageUploadSection = ({
  title,
  existingImages,
  newImages,
  onFileChange,
  onRemoveExisting,
  onRemoveNew,
  name
}) => {
  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold text-[#062970]">{title}</Label>
      <div className="p-6 border-2 border-[#062970] rounded-lg bg-white">
        <div className="flex flex-wrap gap-4 mb-4">
          {existingImages.map((img, index) => (
            <div key={`existing-${index}`} className="relative">
              <img 
                src={img} 
                alt={`${title} ${index + 1}`} 
                className="w-24 h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => onRemoveExisting(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {newImages.map((file, index) => (
            <div key={`new-${index}`} className="relative">
              <img 
                src={URL.createObjectURL(file)} 
                alt={`New ${title.toLowerCase()} ${index + 1}`} 
                className="w-24 h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => onRemoveNew(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#062970] border-dashed rounded-lg cursor-pointer bg-[#f3e8ff] hover:bg-[#e0d7f5]">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <PlusCircleIcon className="w-8 h-8 mb-4 text-[#062970]" />
            <p className="mb-2 text-sm text-[#062970]">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
          </div>
          <input
            type="file"
            onChange={(e) => onFileChange(e, name)}
            multiple
            accept="image/*"
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
export default ImageUploadSection;