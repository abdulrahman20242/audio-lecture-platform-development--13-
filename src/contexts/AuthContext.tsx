import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserData, DeviceData } from '../types';
import { getOrCreateDeviceId, getBrowserName, getOSName, getDeviceDescription } from '../utils/device';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  deviceData: DeviceData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

// Redirect URL after email verification - always use origin without path
const REDIRECT_URL = window.location.origin;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Flag to prevent onAuthStateChanged from interfering during signUp
  const isSigningUp = useRef(false);

  // Helper: check if user is admin via Custom Claims or Firestore
  async function isAdminUser(firebaseUser: User): Promise<boolean> {
    try {
      // 1. Check Custom Claims first (fastest)
      const tokenResult = await firebaseUser.getIdTokenResult();
      if (tokenResult.claims.admin === true) {
        return true;
      }

      // 2. Fallback to Firestore document check
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        return true;
      }

      // 3. Bootstrap: If no users exist in the collection, make the first one an admin
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  // Helper: ensure admin has a Firestore document
  async function ensureAdminDocument(firebaseUser: User): Promise<UserData> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = { uid: firebaseUser.uid, ...userDoc.data() } as UserData;
      // Make sure role is admin
      if (data.role !== 'admin') {
        await updateDoc(userDocRef, { role: 'admin' });
        data.role = 'admin';
      }
      return data;
    }
    
    // Create admin document if it doesn't exist
    const adminData = {
      name: firebaseUser.displayName || 'Admin',
      email: firebaseUser.email || '',
      phone: '',
      role: 'admin',
      status: 'approved',
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      lastActiveDevice: '',
      emailVerified: firebaseUser.emailVerified
    };
    await setDoc(userDocRef, adminData);
    return { uid: firebaseUser.uid, ...adminData } as UserData;
  }

  async function fetchUserData(firebaseUser: User) {
    try {
      // Check if admin first
      const isAdmin = await isAdminUser(firebaseUser);
      
      if (isAdmin) {
        const adminData = await ensureAdminDocument(firebaseUser);
        setUserData(adminData);
        setDeviceData(null);
        return;
      }

      // Not admin - check if email is verified
      if (!firebaseUser.emailVerified) {
        // Student with unverified email - sign them out
        await firebaseSignOut(auth);
        setUser(null);
        setUserData(null);
        setDeviceData(null);
        return;
      }

      // Student with verified email - get their Firestore document
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setUserData(null);
        setDeviceData(null);
        return;
      }

      const data = { uid: firebaseUser.uid, ...userDoc.data() } as UserData;
      setUserData(data);

      // If student is not approved, skip device check
      if (data.status !== 'approved') {
        setDeviceData(null);
        return;
      }

      // Handle device registration/check
      const deviceId = getOrCreateDeviceId();
      const deviceDocRef = doc(db, 'users', firebaseUser.uid, 'devices', deviceId);
      const deviceDoc = await getDoc(deviceDocRef);

      if (deviceDoc.exists()) {
        const device = { deviceId, ...deviceDoc.data() } as DeviceData;
        setDeviceData(device);

        // Update last seen (non-blocking)
        updateDoc(deviceDocRef, {
          lastSeenAt: serverTimestamp()
        }).catch(() => {});

        // Check concurrent use if device is approved
        if (device.status === 'approved') {
          checkConcurrentUse(firebaseUser.uid, deviceId, data).catch(() => {});
        }
      } else {
        // New device - register it
        const newDevice: Record<string, any> = {
          deviceId: deviceId,
          browserName: getBrowserName(),
          osName: getOSName(),
          userId: firebaseUser.uid,
          userName: data.name,
          userEmail: data.email,
          status: 'pending',
          canDownloadAudio: false,
          firstSeenAt: serverTimestamp(),
          lastSeenAt: serverTimestamp()
        };

        await setDoc(deviceDocRef, newDevice);
        setDeviceData({ deviceId, ...newDevice } as DeviceData);

        // Create alert for new device
        await addDoc(collection(db, 'alerts'), {
          type: 'new_device',
          userId: firebaseUser.uid,
          userName: data.name,
          deviceInfo: getDeviceDescription(),
          status: 'unread',
          createdAt: serverTimestamp()
        });

        // Check device limit
        const [devicesSnap, settingsDoc] = await Promise.all([
          getDocs(collection(db, 'users', firebaseUser.uid, 'devices')),
          getDoc(doc(db, 'settings', 'global'))
        ]);
        const maxDevices = settingsDoc.exists() ? settingsDoc.data().maxDevicesPerUser : 3;

        if (devicesSnap.size > maxDevices) {
          await addDoc(collection(db, 'alerts'), {
            type: 'device_limit',
            userId: firebaseUser.uid,
            userName: data.name,
            deviceInfo: `${devicesSnap.size} أجهزة (الحد: ${maxDevices})`,
            status: 'unread',
            createdAt: serverTimestamp()
          });
        }
      }

      // Update last active (non-blocking)
      updateDoc(userDocRef, {
        lastActiveAt: serverTimestamp(),
        lastActiveDevice: deviceId
      }).catch(() => {});

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  async function checkConcurrentUse(uid: string, currentDeviceId: string, data: UserData) {
    try {
      if (data.lastActiveDevice && 
          data.lastActiveDevice !== currentDeviceId && 
          data.lastActiveAt) {
        const lastActive = data.lastActiveAt.toDate ? data.lastActiveAt.toDate() : new Date(data.lastActiveAt);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (lastActive > fiveMinutesAgo) {
          await addDoc(collection(db, 'alerts'), {
            type: 'concurrent_use',
            userId: uid,
            userName: data.name,
            deviceInfo: 'جهازان نشطان في نفس الوقت',
            status: 'unread',
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error checking concurrent use:', error);
    }
  }

  async function refreshUserData() {
    if (user) {
      await fetchUserData(user);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If we're in the middle of signing up, ignore auth state changes
      if (isSigningUp.current) {
        return;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserData(firebaseUser);
      } else {
        setUser(null);
        setUserData(null);
        setDeviceData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    
    // Reload user to get latest emailVerified status
    await cred.user.reload();
    
    // Check if user is an admin using our robust helper
    const isAdmin = await isAdminUser(cred.user);
    
    // If admin — allow login immediately regardless of emailVerified
    if (isAdmin) {
      console.log('Admin login detected');
      // Ensure admin Firestore document exists
      await ensureAdminDocument(cred.user);
      return;
    }
    
    // Not admin — check email verification
    if (!cred.user.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error('EMAIL_NOT_VERIFIED');
    }
    
    // Check Firestore document exists
    const userDocRef = doc(db, 'users', cred.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      await firebaseSignOut(auth);
      throw new Error('الحساب غير مسجل في النظام. تواصل مع المدرس.');
    }
  }

  async function signUp(name: string, email: string, password: string, phone: string) {
    // Set flag to prevent onAuthStateChanged from interfering
    isSigningUp.current = true;
    
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification with redirect URL
      await sendEmailVerification(cred.user, {
        url: REDIRECT_URL,
        handleCodeInApp: false
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        name,
        email,
        phone,
        role: 'student',
        status: 'pending',
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        lastActiveDevice: '',
        emailVerified: false
      });

      // Create alert for new student
      await addDoc(collection(db, 'alerts'), {
        type: 'new_student',
        userId: cred.user.uid,
        userName: name,
        deviceInfo: '',
        status: 'unread',
        createdAt: serverTimestamp()
      });

      // Sign out - user must verify email before logging in
      await firebaseSignOut(auth);
      
      // Clear the auth state manually since we're blocking onAuthStateChanged
      setUser(null);
      setUserData(null);
      setDeviceData(null);
    } finally {
      // Always reset the flag
      isSigningUp.current = false;
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
    setDeviceData(null);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function resendVerificationEmail() {
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser, {
        url: REDIRECT_URL,
        handleCodeInApp: false
      });
    }
  }

  const value = useMemo<AuthContextType>(() => ({
    user,
    userData,
    deviceData,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendVerificationEmail,
    refreshUserData
  }), [user, userData, deviceData, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
