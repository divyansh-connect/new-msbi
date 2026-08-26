export type UserRole = string;

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  clinic: string;
}

export interface CampaignItem {
  id: number;
  title: string;
  owner: string;
  status: 'Active' | 'Draft' | 'Paused';
  budget: string;
  spent: string;
  roi: string;
  channel: string;
  leads: number;
  startDate?: string;
  endDate?: string;
}

export interface ReviewItem {
  id: number;
  author: string;
  initials: string;
  verified: boolean;
  rating: number;
  date: string;
  location: string;
  text: string;
  replied: boolean;
  replyText?: string;
}

export interface VendorItem {
  id: number;
  name: string;
  category: string;
  initials: string;
  score: number;
  spend: string;
  renewalDate: string;
  daysLeft: number;
  urgent: boolean;
  status: string;
  contactName?: string;
  contactEmail?: string;
}

export interface CallLogItem {
  id: number;
  callerName: string;
  phoneNumber: string;
  duration: string;
  timestamp: string;
  campaign: string;
  status: 'Answered' | 'Missed' | 'Voicemail';
  audioUrl?: string;
}

export interface DoctorRatingItem {
  id: number;
  doctorName: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  clinic: string;
}
