import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserDataContext = createContext(null);

function UserContext({ children }) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [userData, setUserData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/user/currentuser`,
        { withCredentials: true }
      );
      setUserData(result.data?.user ?? null);
      console.log("Current User Data:", result.data);
    } catch (error) {
      console.error("Error fetching current user data:", error);
    }
  };

  const getGeminiResponse = async (command) => {
    try {
      const result = await axios.post(
        `${serverUrl}/api/user/asktoassistant`,
        { command },
        { withCredentials: true }
      );
      return result.data;
    }
    catch (error) {
      console.error("Error getting Gemini response:", error);
      throw error;
    }
  };

  useEffect(() => {
    handleCurrentUser();
  }, []);

  return (
    <UserDataContext.Provider
      value={{
        serverUrl,
        userData,
        setUserData,
        backendImage,
        setBackendImage,
        frontendImage,
        setFrontendImage,
        selectedImage,
        setSelectedImage,
        getGeminiResponse
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export default UserContext;
