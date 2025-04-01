/* eslint-disable react/prop-types */
import { EditableField } from "./EditableField";
import { ServiceList } from "./ServiceList";
import { ImageUploadSection } from "./ImageUploadSection";

export const ServiceProviderSection = ({
  register,
  errors,
  editingField,
  setEditingField,
  watch,
  fields,
  append,
  remove,
  existingWorkImages,
  existingCertifications,
  workImages,
  certificationImages,
  handleFileChange,
  removeWorkImage,
  removeCertification
}) => {
  return (
    <>
      <EditableField
        name="profession"
        label="Profession"
        register={register}
        value={watch("profession")}
        isEditing={editingField === "profession"}
        onEdit={() => setEditingField("profession")}
        onSave={() => setEditingField(null)}
        required
        error={errors.profession?.message}
      />
      
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
      />

      <ServiceList 
        fields={fields}
        register={register}
        append={append}
        remove={remove}
        errors={errors}
      />

      <ImageUploadSection
        title="Work Portfolio"
        existingImages={existingWorkImages}
        newImages={workImages}
        onFileChange={handleFileChange}
        onRemoveExisting={(index) => removeWorkImage(index, true)}
        onRemoveNew={removeWorkImage}
        name="workImages"
      />

      <ImageUploadSection
        title="Certifications"
        existingImages={existingCertifications}
        newImages={certificationImages}
        onFileChange={handleFileChange}
        onRemoveExisting={(index) => removeCertification(index, true)}
        onRemoveNew={removeCertification}
        name="certificationImages"
      />
    </>
  );
};

export default ServiceProviderSection;