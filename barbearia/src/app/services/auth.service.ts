import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession, User } from '../models';
import { DataService } from './data.service';
import { StorageService } from './storage.service';

const SESSION_KEY = 'session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _session = signal<AuthSession | null>(null);

  readonly currentUser = computed<User | null>(() => {
    const s = this._session();
    if (!s) return null;
    return this.data.findUserById(s.userId) ?? null;
  });

  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isBarber = computed(() => this.currentUser()?.role === 'barber');
  readonly isClient = computed(() => this.currentUser()?.role === 'client');

  constructor(
    private data: DataService,
    private storage: StorageService,
    private router: Router,
  ) {
    const stored = this.storage.get<AuthSession | null>(SESSION_KEY, null);
    if (stored) this._session.set(stored);
  }

  login(email: string, password: string): User {
    const user = this.data.findUserByEmail(email);
    if (!user) throw new Error('Usuário não encontrado.');
    if (!this.data.verifyPassword(user, password)) {
      throw new Error('Senha incorreta.');
    }
    this.persistSession(user);
    return user;
  }

  register(input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: 'client' | 'barber';
  }): User {
    const user = this.data.createUser(input);
    this.persistSession(user);
    return user;
  }

  /** Stub para login social — deve ser substituído por Firebase Auth / OAuth real. */
  mockSocialLogin(provider: 'google' | 'apple'): User {
    const email = `demo+${provider}@barbearia.com`;
    let user = this.data.findUserByEmail(email);
    if (!user) {
      user = this.data.createUser({
        name: provider === 'google' ? 'Cliente Google' : 'Cliente Apple',
        email,
        password: 'social-' + provider,
        role: 'client',
      });
    }
    this.persistSession(user);
    return user;
  }

  logout() {
    this._session.set(null);
    this.storage.remove(SESSION_KEY);
    this.router.navigate(['/']);
  }

  private persistSession(user: User) {
    const session: AuthSession = {
      userId: user.id,
      token: 'mock-' + user.id,
      issuedAt: new Date().toISOString(),
    };
    this._session.set(session);
    this.storage.set(SESSION_KEY, session);
  }
}
