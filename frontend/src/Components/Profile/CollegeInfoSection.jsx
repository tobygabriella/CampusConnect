import CollegeSelect from "@/Components/Onboarding/CollegeSelect";
import { Label } from "@/components/ui/label";

export const CollegeInfoSection = ({ role, watch, setValue }) => {
  return (
    <>
      {role === "student" && (
        <div className="space-y-2">
          <Label className="text-lg font-semibold text-[#062970]">Your College</Label>
          <CollegeSelect 
            value={watch("college")} 
            onChange={(value) => setValue("college", value, { shouldDirty: true })}
            singleSelect
          />
        </div>
      )}

      {role === "service_provider" && (
        <div className="space-y-2">
          <Label className="text-lg font-semibold text-[#062970]">Colleges You Serve</Label>
          <CollegeSelect 
            value={watch("collegesServed") || []} 
            onChange={(values) => setValue("collegesServed", values, { shouldDirty: true })}
            multiple
          />
        </div>
      )}
    </>
  );
};
export default CollegeInfoSection;