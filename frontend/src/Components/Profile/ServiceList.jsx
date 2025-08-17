import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2Icon, PlusCircleIcon, DollarSign, Clock } from "lucide-react";
import { useEffect } from "react";
import { Controller } from "react-hook-form";

export const ServiceList = ({ 
  fields, 
  register, 
  append, 
  remove, 
  errors, 
  watch, 
  setValue,
  control
}) => {
  // Watch all service prices to validate deposits
  const services = watch("services");

  useEffect(() => {
    // Validate deposits whenever prices change
    if (services) {
      services.forEach((service, index) => {
        const price = parseFloat(service?.price) || 0;
        const deposit = parseFloat(service?.depositAmount) || 0;
        
        if (deposit > price * 0.5) {
          // Automatically adjust deposit if it exceeds 50%
          setValue(`services.${index}.depositAmount`, (price * 0.5).toFixed(2));
        }
      });
    }
  }, [services, setValue]);

  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold text-[#062970]">Services Offered</Label>
      <div className="space-y-4">
        {fields.map((field, index) => {
          const currentPrice = parseFloat(services?.[index]?.price) || 0;
          const maxDeposit = (currentPrice * 0.5).toFixed(2);

          return (
            <div key={field.id} className="p-4 border-2 border-[#062970] rounded-lg bg-white">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="w-full md:flex-1">
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
                
                <div className="w-full md:w-32">
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
                
                <div className="w-full md:w-32">
                  <Label className="text-[#062970]">Deposit (≤50%)</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-[#062970]" />
                    <Controller
                      name={`services.${index}.depositAmount`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder={`Max ${maxDeposit}`}
                          className="pl-9 border-2 border-[#062970] text-[#062970]"
                          onChange={(e) => {
                            const raw = e.target.value;
                            const deposit = parseFloat(raw) || 0;
                            const capped = deposit > currentPrice * 0.5 ? maxDeposit : raw;
                            field.onChange(capped);
                          }}
                        />
                      )}
                    />
                  </div>
                  {errors.services?.[index]?.depositAmount && (
                    <p className="text-red-500 text-sm">{errors.services[index].depositAmount.message}</p>
                  )}
                </div>

                
                <div className="w-full md:w-32">
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
                
                <div className="w-full flex justify-end md:w-auto md:block">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="md:mt-7 hover:bg-red-50"
                    style={{ color: "#062970"}}
                  >
                    <Trash2Icon className="h-5 w-5 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: "", price: "", duration: "", depositAmount: "" })}
          className="w-full bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
          style={{ color: "#062970"}}
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Add Another Service
        </Button>
      </div>
    </div>
  );
};

export default ServiceList;