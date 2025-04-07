import { useMemo } from 'react';
import { useAuth } from "@/Components/context/AuthContext";

export const useUserColleges = () => {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user) return [];
    
    if (user.role === "service_provider") {
      return user.collegesServed?.map(c => String(c.id)) || [];
    }
    
    return user.collegeId ? [String(user.collegeId)] : [];
  }, [user]);
};