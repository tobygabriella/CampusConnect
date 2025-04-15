/* eslint-disable react/prop-types */
import { EditableField } from "./EditableField";
import { ServiceList } from "./ServiceList";
import { ImageUploadSection } from "./ImageUploadSection";

export const ServiceProviderSection = ({
  ProfessionInput,
  register,
  errors,
  editingField,
  setEditingField,
  watch,
  setValue,
  fields,
  append,
  remove,
  existingWorkImages,
  existingCertifications,
  workImages,
  certificationImages,
  handleFileChange,
  removeWorkImage,
  removeCertification,
  control,
  mode = "editable",
}) => {
  return (
    <div className="space-y-6 text-[#062970]">
      {ProfessionInput}
      
      <EditableField
        name="biography"
        label="Biography"
        register={register}
        value={watch("biography")}
        isEditing={editingField === "biography"}
        onEdit={() => setEditingField("biography")}
        onSave={() => setEditingField(null)}
        isTextarea
        required
        error={errors.biography?.message}
        mode={mode}
      />
      
      <EditableField
        name="experience"
        label="Experience"
        register={register}
        value={watch("experience")}
        isEditing={editingField === "experience"}
        onEdit={() => setEditingField("experience")}
        onSave={() => setEditingField(null)}
        isTextarea
        required
        error={errors.experience?.message}
        mode={mode}
      />
      
      <EditableField
        name="location"
        label="Location"
        register={register}
        value={watch("location")}
        isEditing={editingField === "location"}
        onEdit={() => setEditingField("location")}
        onSave={() => setEditingField(null)}
        required
        error={errors.location?.message}
        mode={mode}
      />
      
      <EditableField
        name="policy"
        label="Policies"
        register={register}
        value={watch("policy")}
        isEditing={editingField === "policy"}
        onEdit={() => setEditingField("policy")}
        onSave={() => setEditingField(null)}
        isTextarea
        required
        error={errors.policy?.message}
        mode={mode}
      />

      {/* Add Cancellation Policy Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableField
          name="cancellationWindow"
          label="Cancellation Window (hours)"
          register={register}
          value={watch("cancellationWindow")}
          isEditing={editingField === "cancellationWindow"}
          onEdit={() => setEditingField("cancellationWindow")}
          onSave={() => setEditingField(null)}
          required
          error={errors.cancellationWindow?.message}
          mode={mode}
        />
        
        <EditableField
          name="rescheduleFee"
          label="Reschedule Fee (%)"
          register={register}
          value={watch("rescheduleFee")}
          isEditing={editingField === "rescheduleFee"}
          onEdit={() => setEditingField("rescheduleFee")}
          onSave={() => setEditingField(null)}
          required
          error={errors.rescheduleFee?.message}
          mode={mode}
        />
      </div>

      <ServiceList 
        fields={fields}
        register={register}
        append={append}
        remove={remove}
        errors={errors}
        watch={watch}
        setValue={setValue}
        control={control}
      />

      <ImageUploadSection
        title="Work Portfolio"
        existingImages={existingWorkImages}
        newImages={workImages}
        onFileChange={handleFileChange}
        onRemoveExisting={(index) => removeWorkImage(index, true)}
        onRemoveNew={(index) => removeWorkImage(index, false)}
        name="work"
      />

      <ImageUploadSection
        title="Certifications"
        existingImages={existingCertifications}
        newImages={certificationImages}
        onFileChange={handleFileChange}
        onRemoveExisting={(index) => removeCertification(index, true)}
        onRemoveNew={(index) => removeCertification(index, false)}
        name="certification"
      />
    </div>
  );
};

export default ServiceProviderSection;