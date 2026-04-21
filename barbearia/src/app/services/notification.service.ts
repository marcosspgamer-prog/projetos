import { Injectable, signal } from '@angular/core';

export type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  level: ToastLevel;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private counter = 0;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, level: ToastLevel = 'info', durationMs = 4000) {
    const id = ++this.counter;
    this.toasts.update((list) => [...list, { id, level, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string) {
    this.show(message, 'success');
  }
  error(message: string) {
    this.show(message, 'error', 6000);
  }
  warning(message: string) {
    this.show(message, 'warning', 5000);
  }
  info(message: string) {
    this.show(message, 'info');
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
