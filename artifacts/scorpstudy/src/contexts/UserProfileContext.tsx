import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfileData {
  firstName: string;
  nickname?: string;
  studyLevel: string;
  learningGoal: string;
  preferredLanguage: string;
  interactionStyle: string;
  onboardingCompleted: boolean;
}

interface UserProfileContextValue {
  profile: UserProfileData | null;
  needsOnboarding: boolean;
  profileLoaded: boolean;
  saveProfile: (data: UserProfileData) => void;
  updateProfile: (data: Partial<UserProfileData>) => void;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  needsOnboarding: false,
  profileLoaded: false,
  saveProfile: () => {},
  updateProfile: () => {},
});

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setProfile(null); setProfileLoaded(true); return; }
    try {
      const saved = localStorage.getItem(`scorpstudy-profile-${user.id}`);
      if (saved) setProfile(JSON.parse(saved));
    } catch { /* silent */ }
    setProfileLoaded(true);
  }, [user?.id]);

  const saveProfile = (data: UserProfileData) => {
    setProfile(data);
    if (user) {
      localStorage.setItem(`scorpstudy-profile-${user.id}`, JSON.stringify(data));
      fetch(`${BASE}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...data }),
      }).catch(() => {});
    }
  };

  const updateProfile = (updates: Partial<UserProfileData>) => {
    if (!profile) return;
    saveProfile({ ...profile, ...updates });
  };

  const needsOnboarding = profileLoaded && !!user && (!profile || !profile.onboardingCompleted);

  return (
    <UserProfileContext.Provider value={{ profile, needsOnboarding, profileLoaded, saveProfile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
