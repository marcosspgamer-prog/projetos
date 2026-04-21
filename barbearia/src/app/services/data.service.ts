import { Injectable, signal } from '@angular/core';
import {
  Appointment,
  BarberProfile,
  GalleryItem,
  Service,
  User,
  WorkingHours,
} from '../models';
import { StorageService } from './storage.service';

const KEYS = {
  users: 'users',
  barber: 'barber',
  appointments: 'appointments',
  seeded: 'seeded.v1',
};

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  ).toUpperCase();
}

const DEFAULT_HOURS: WorkingHours = {
  0: { open: false, start: '09:00', end: '18:00' }, // Dom
  1: { open: true, start: '09:00', end: '19:00' },
  2: { open: true, start: '09:00', end: '19:00' },
  3: { open: true, start: '09:00', end: '19:00' },
  4: { open: true, start: '09:00', end: '19:00' },
  5: { open: true, start: '09:00', end: '20:00' },
  6: { open: true, start: '08:00', end: '17:00' },
};

const DEFAULT_SERVICES: Service[] = [
  {
    id: 'svc-corte',
    name: 'Corte masculino',
    description: 'Corte na tesoura e máquina com acabamento.',
    durationMin: 40,
    priceCents: 5000,
  },
  {
    id: 'svc-barba',
    name: 'Barba',
    description: 'Barba desenhada com toalha quente.',
    durationMin: 30,
    priceCents: 4000,
  },
  {
    id: 'svc-combo',
    name: 'Corte + Barba',
    description: 'Combo completo com hidratação.',
    durationMin: 60,
    priceCents: 8000,
  },
  {
    id: 'svc-pigmentacao',
    name: 'Pigmentação',
    description: 'Disfarce e pigmentação em cabelo ou barba.',
    durationMin: 45,
    priceCents: 6000,
  },
];

const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: 'g1',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=70',
    caption: 'Degradê clássico',
  },
  {
    id: 'g2',
    url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=70',
    caption: 'Barba desenhada',
  },
  {
    id: 'g3',
    url: 'https://images.unsplash.com/photo-1521490878406-b748dcff7ae4?auto=format&fit=crop&w=800&q=70',
    caption: 'Social liso',
  },
  {
    id: 'g4',
    url: 'https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=800&q=70',
    caption: 'Textura moderna',
  },
  {
    id: 'g5',
    url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=70',
    caption: 'Corte infantil',
  },
  {
    id: 'g6',
    url: 'https://images.unsplash.com/photo-1633681926035-ec1ac984418a?auto=format&fit=crop&w=800&q=70',
    caption: 'Finalização',
  },
];

const DEFAULT_BARBER: BarberProfile = {
  id: 'barber-1',
  displayName: 'Tony Barbearia',
  tagline: 'A sua barbearia de confiança em Santo André.',
  bio: 'Mais de 10 anos cortando cabelo e cuidando da barba com técnica, estilo e atendimento personalizado. Ambiente moderno, produtos premium e café por conta da casa.',
  address: 'Alameda Marquês de Barbacena, 231 — Santo André, SP',
  phone: '+55 11 99999-0000',
  instagram: '@tonybarbearia',
  whatsapp: '+55 11 99999-0000',
  avatarUrl:
    'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=300&q=70',
  coverUrl:
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1600&q=70',
  workingHours: DEFAULT_HOURS,
  services: DEFAULT_SERVICES,
  gallery: DEFAULT_GALLERY,
  slotMinutes: 30,
};

@Injectable({ providedIn: 'root' })
export class DataService {
  readonly users = signal<User[]>([]);
  readonly barber = signal<BarberProfile>(DEFAULT_BARBER);
  readonly appointments = signal<Appointment[]>([]);

  constructor(private storage: StorageService) {
    this.seedIfNeeded();
    this.users.set(this.storage.get<User[]>(KEYS.users, []));
    this.barber.set(
      this.storage.get<BarberProfile>(KEYS.barber, DEFAULT_BARBER),
    );
    this.appointments.set(
      this.storage.get<Appointment[]>(KEYS.appointments, []),
    );
  }

  // ----- seed -----
  private seedIfNeeded() {
    const seeded = this.storage.get<boolean>(KEYS.seeded, false);
    if (seeded) return;
    const users: User[] = [
      {
        id: 'user-barber',
        name: 'Tony (Barbeiro)',
        email: 'tony@barbearia.com',
        phone: '+55 11 99999-0000',
        passwordHash: hash('tony123'),
        role: 'barber',
        createdAt: new Date().toISOString(),
        avatarUrl: DEFAULT_BARBER.avatarUrl,
      },
      {
        id: 'user-demo',
        name: 'Marcos Cliente',
        email: 'cliente@demo.com',
        phone: '+55 11 98888-7777',
        passwordHash: hash('demo123'),
        role: 'client',
        createdAt: new Date().toISOString(),
      },
    ];
    this.storage.set(KEYS.users, users);
    this.storage.set(KEYS.barber, DEFAULT_BARBER);
    this.storage.set<Appointment[]>(KEYS.appointments, []);
    this.storage.set(KEYS.seeded, true);
  }

  // ----- users -----
  saveUsers(users: User[]) {
    this.users.set(users);
    this.storage.set(KEYS.users, users);
  }

  createUser(
    input: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string },
  ): User {
    const user: User = {
      id: 'user-' + uid(),
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      avatarUrl: input.avatarUrl,
      role: input.role,
      passwordHash: hash(input.password),
      createdAt: new Date().toISOString(),
    };
    const current = this.users();
    if (current.some((u) => u.email === user.email)) {
      throw new Error('E-mail já cadastrado.');
    }
    this.saveUsers([...current, user]);
    return user;
  }

  findUserByEmail(email: string): User | undefined {
    return this.users().find((u) => u.email === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.users().find((u) => u.id === id);
  }

  verifyPassword(user: User, password: string): boolean {
    return user.passwordHash === hash(password);
  }

  // ----- barber profile -----
  saveBarber(profile: BarberProfile) {
    this.barber.set(profile);
    this.storage.set(KEYS.barber, profile);
  }

  // ----- appointments -----
  saveAppointments(list: Appointment[]) {
    this.appointments.set(list);
    this.storage.set(KEYS.appointments, list);
  }

  addAppointment(appt: Appointment) {
    this.saveAppointments([...this.appointments(), appt]);
  }

  updateAppointment(id: string, patch: Partial<Appointment>) {
    this.saveAppointments(
      this.appointments().map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  }

  appointmentsForClient(clientId: string): Appointment[] {
    return this.appointments()
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }

  appointmentsForBarber(): Appointment[] {
    return [...this.appointments()].sort((a, b) =>
      a.startAt.localeCompare(b.startAt),
    );
  }
}

/** Hash simples e determinístico (SOMENTE para MVP — substituir no backend real). */
export function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return 'h_' + (h >>> 0).toString(36);
}

export function newId(): string {
  return uid();
}
