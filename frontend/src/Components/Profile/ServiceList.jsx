import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2Icon, PlusCircleIcon, DollarSign, Clock } from "lucide-react";

export const ServiceList = ({ fields, register, append, remove, errors }) => {
  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold text-[#062970]">Services Offered</Label>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border-2 border-[#062970] rounded-lg bg-white">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <Label className="text-[#062970]">Service Name</Label>
                <Input
                  {...register(`services.${index}.name`)}
                  placeholder="e.g., Haircut, Styling"
                  className="mt-1 border-2 border-[#062970] text-[#062970]"
                />
                {errors.services?.[index]?.name && (
                  <p className="text-red-500 text-sm">{errors.services[index].name.message}</p>
                )}
              </div>
              <div className="w-32">
                <Label className="text-[#062970]">Price</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-[#062970]" />
                  <Input
                    {...register(`services.${index}.price`)}
                    placeholder="0.00"
                    className="pl-9 border-2 border-[#062970] text-[#062970]"
                  />
                </div>
                {errors.services?.[index]?.price && (
                  <p className="text-red-500 text-sm">{errors.services[index].price.message}</p>
                )}
              </div>
              <div className="w-32">
                <Label className="text-[#062970]">Duration</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-[#062970]" />
                  <Input
                    {...register(`services.${index}.duration`)}
                    placeholder="mins"
                    type="number"
                    className="pl-9 border-2 border-[#062970] text-[#062970]"
                  />
                </div>
                {errors.services?.[index]?.duration && (
                  <p className="text-red-500 text-sm">{errors.services[index].duration.message}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="mt-7 hover:bg-red-50"
              >
                <Trash2Icon className="h-5 w-5 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: "", price: "", duration: "" })}
          className="w-full py-3 border-2 border-[#062970] text-[#062970] hover:bg-[#f3e8ff]"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Add Another Service
        </Button>
      </div>
    </div>
  );
};

export default ServiceList;