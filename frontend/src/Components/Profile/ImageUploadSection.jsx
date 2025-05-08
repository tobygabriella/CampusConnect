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
        {/* Images Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
          {/* Existing Images */}
          {existingImages.map((img, index) => (
            <div key={`existing-${index}`} className="relative group">
              <img 
                src={img} 
                alt={`${title} ${index + 1}`} 
                className="w-full h-32 object-cover aspect-square rounded-lg"
              />
              <button
                type="button"
                onClick={() => onRemoveExisting(index)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          
          {/* New Images */}
          {newImages.map((file, index) => (
            <div key={`new-${index}`} className="relative group">
            <img 
              src={URL.createObjectURL(file)} 
              alt={`New ${title.toLowerCase()} ${index + 1}`} 
              className="w-full h-32 object-cover aspect-square rounded-lg"
            />
              <button
                type="button"
                onClick={() => onRemoveNew(index)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        
        {/* Upload Area */}
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#062970] border-dashed rounded-lg cursor-pointer bg-[#f3e8ff] hover:bg-[#e0d7f5] transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <PlusCircleIcon className="w-8 h-8 mb-4 text-[#062970]" />
            <p className="mb-2 text-sm text-[#062970] text-center">
              <span className="font-semibold">Click to upload</span> or drag and drop<br />
              <span className="text-xs">(Multiple files allowed)</span>
            </p>
          </div>
          <input
            type="file"
            onChange={(e) => onFileChange(e, name)}
            multiple
            accept="image/jpeg, image/png, image/jpg, image/webp"
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
export default ImageUploadSection;