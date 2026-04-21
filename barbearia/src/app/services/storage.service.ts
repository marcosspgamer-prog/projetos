import { Injectable } from '@angular/core';

/**
 * Wrapper simples sobre localStorage. Mantido pequeno e substituível —
 * trocar para Firestore / API REST é só reimplementar esta classe.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'barbearia.';

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  get<T>(key: string, fallback: T): T {
    if (!this.isBrowser()) return fallback;
    const raw = window.localStorage.getItem(this.prefix + key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  remove(key: string): void {
    if (!this.isBrowser()) return;
    window.localStorage.removeItem(this.prefix + key);
  }
}
