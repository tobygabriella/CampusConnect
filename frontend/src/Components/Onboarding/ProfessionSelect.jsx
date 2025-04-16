// src/components/ProfessionSelect.jsx
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import api from "@/utils/axiosInstance";
import { toast } from "react-toastify";

const ProfessionSelect = ({ value, onChange, error }) => {
  const [professions, setProfessions] = useState([]);
  const [newProfession, setNewProfession] = useState("");

  useEffect(() => {
    api.get("/service-provider/professions").then(res => {
      setProfessions(res.data);
    });
  }, []);

  const handleAddProfession = async () => {
    if (!newProfession.trim()) return;
    try {
      const res = await api.post("/service-provider/professions", { name: newProfession.trim() });
      const added = res.data;
      setProfessions(prev => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(added.name);
      setNewProfession("");
      toast.success("Profession added!");
    } catch {
      toast.error("Could not add profession");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-lg font-semibold text-[#062970]">Profession</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full p-3 bg-white border-2 border-[#062970] rounded-lg">
          <SelectValue placeholder="Select your profession" />
        </SelectTrigger>
        <SelectContent className="bg-white border-2 border-[#062970] z-[100]">
          {professions.map((p) => (
            <SelectItem key={p.id} value={p.name} className="text-[#062970] hover:bg-[#f3e8ff]">
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2 mt-2">
        <Input
          placeholder="Or type a new profession"
          value={newProfession}
          onChange={(e) => setNewProfession(e.target.value)}
          className="border-[#062970]"
        />
        <Button type="button" onClick={handleAddProfession}>Add</Button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default ProfessionSelect;

