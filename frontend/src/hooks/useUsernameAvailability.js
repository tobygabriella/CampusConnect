import { useEffect, useState } from "react";
import api from "@/utils/axiosInstance";

const useUsernameAvailability = (username, initialUsername = "") => {
  const [isAvailable, setIsAvailable] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username || username === initialUsername) {
      setIsAvailable(null);
      setError("");
      return;
    }

    const checkUsername = async () => {
      try {
        await api.get(`/onboarding/check-username/${username}`);
        setIsAvailable(true);
        setError("");
      } catch (err) {
        setIsAvailable(false);
        setError(err.response?.data?.message || "Username is already taken.");
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username, initialUsername]);

  return { isAvailable, error };
};

export default useUsernameAvailability;
