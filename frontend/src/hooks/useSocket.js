import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let socket;

export function useSocket(userId, onNotification) {
  const connected = useRef(false);

  useEffect(() => {
    if (!userId) return;

    if (!socket) {
      socket = io("http://localhost:5001", {
        withCredentials: true,
      });
    }

    if (!connected.current) {
      socket.emit("join", userId);
      connected.current = true;
    }

    // Notification listener
    socket.on("notification:new", (data) => {
      if (onNotification) onNotification(data);
    });

    return () => {
      socket.off("notification:new");
    };
  }, [userId, onNotification]);
}
