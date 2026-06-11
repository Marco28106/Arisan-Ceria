import React, { createContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";

export const UserContext = createContext({
  displayName: "",
  photoURL: "",
  loading: true,
  currentUser: null,
  refreshProfile: async () => {},
  refreshDisplayName: async () => {},
});

export function UserProvider({ children }) {
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!auth?.currentUser) return;

    // Force refresh user profile from Firebase Auth
    await auth.currentUser.reload();
    setDisplayName(auth.currentUser.displayName || "");
    setPhotoURL(auth.currentUser.photoURL || "");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
      setDisplayName(user?.displayName || "");
      setPhotoURL(user?.photoURL || "");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      displayName,
      photoURL,
      loading,
      currentUser,
      refreshProfile,
      refreshDisplayName: refreshProfile,
    }),
    [displayName, photoURL, loading, currentUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
