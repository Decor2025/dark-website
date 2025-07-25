import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { uploadToCloudinary } from '../config/cloudinary';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role?: 'customer' | 'employee' | 'editor' | 'viewer') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, profileImage?: File, additionalData?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signup = async (email: string, password: string, role: 'customer' | 'employee' | 'editor' | 'viewer' = 'customer') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const userData: User = {
        uid: result.user.uid,
        email: result.user.email!,
        role,
        createdAt: new Date().toISOString(),
      };
      
      await set(ref(database, `users/${result.user.uid}`), userData);
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateProfile = async (displayName: string, profileImage?: File, additionalData?: any) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      let profileImageUrl = currentUser.profileImage;
      
      if (profileImage) {
        profileImageUrl = await uploadToCloudinary(profileImage);
      }

      const updatedUser: User = {
        ...currentUser,
        displayName,
        profileImage: profileImageUrl,
        ...additionalData,
      };

      const userRef = ref(database, `users/${currentUser.uid}`);
      await set(userRef, updatedUser);
      setCurrentUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update profile');
      throw error;
    }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setCurrentUser(snapshot.val() as User);
          } else {
            // If user data doesn't exist, create it with customer role
            const userData: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              role: 'customer',
              createdAt: new Date().toISOString(),
            };
            await set(userRef, userData);
            setCurrentUser(userData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};