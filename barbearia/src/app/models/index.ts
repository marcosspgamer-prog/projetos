export type Role = 'client' | 'barber';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMin: number;
  priceCents: number;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
}

export interface DayHours {
  open: boolean;
  start: string; // "09:00"
  end: string; // "19:00"
}

export type WorkingHours = Record<
  0 | 1 | 2 | 3 | 4 | 5 | 6, // 0=Dom .. 6=Sáb
  DayHours
>;

export interface BarberProfile {
  id: string;
  displayName: string;
  tagline: string;
  bio: string;
  address: string;
  phone: string;
  instagram?: string;
  whatsapp?: string;
  avatarUrl: string;
  coverUrl: string;
  workingHours: WorkingHours;
  services: Service[];
  gallery: GalleryItem[];
  slotMinutes: number; // granularidade da agenda
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  barberId: string;
  serviceId: string;
  serviceName: string;
  priceCents: number;
  durationMin: number;
  startAt: string; // ISO
  endAt: string; // ISO
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  reminderSent?: boolean;
}

export interface AuthSession {
  userId: string;
  token: string;
  issuedAt: string;
}
