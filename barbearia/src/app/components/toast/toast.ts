import { Component, inject } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-stack">
      @for (t of n.toasts(); track t.id) {
        <div class="toast" [class]="t.level" (click)="n.dismiss(t.id)">
          {{ t.message }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-stack {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 100;
        max-width: min(360px, calc(100vw - 40px));
      }
      .toast {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-left: 4px solid var(--accent);
        padding: 12px 14px;
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow);
        cursor: pointer;
        font-size: 0.92rem;
        line-height: 1.4;
      }
      .toast.success {
        border-left-color: var(--success);
      }
      .toast.error {
        border-left-color: var(--danger);
      }
      .toast.warning {
        border-left-color: var(--warning);
      }
      .toast.info {
        border-left-color: var(--accent);
      }
      @media (max-width: 500px) {
        .toast-stack {
          left: 12px;
          right: 12px;
          bottom: 12px;
        }
      }
    `,
  ],
})
export class ToastComponent {
  n = inject(NotificationService);
}
