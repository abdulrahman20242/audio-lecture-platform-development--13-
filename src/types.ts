export interface UserData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  lastActiveAt: any;
  lastActiveDevice: string;
  createdAt: any;
}

export interface DeviceData {
  deviceId: string;
  browserName: string;
  osName: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  canDownloadAudio: boolean;
  firstSeenAt: any;
  lastSeenAt: any;
}

export interface SubjectData {
  id: string;
  name: string;
  doctorName: string;
  order: number;
  createdAt: any;
}

export interface LectureData {
  id: string;
  title: string;
  audioUrl: string;
  pdfUrl: string;
  order: number;
  createdAt: any;
}

export interface AlertData {
  id: string;
  type: 'new_student' | 'new_device' | 'device_limit' | 'concurrent_use';
  userId: string;
  userName: string;
  deviceInfo: string;
  status: 'unread' | 'read';
  createdAt: any;
}

export interface SettingsData {
  maxDevicesPerUser: number;
}
