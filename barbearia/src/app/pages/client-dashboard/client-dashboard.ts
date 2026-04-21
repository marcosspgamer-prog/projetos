import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../models';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="container section">
      <div class="spread">
        <div>
          <h1>Meus cortes</h1>
          <p class="dim">
            Olá, <strong>{{ auth.currentUser()?.name }}</strong>. Veja seus
            agendamentos e lembretes.
          </p>
        </div>
        <a class="btn" routerLink="/agendar">Novo agendamento</a>
      </div>

      @if (upcoming().length === 0 && past().length === 0) {
        <div class="card empty">
          <h3>Você ainda não tem agendamentos.</h3>
          <p class="dim">Que tal marcar o próximo corte agora?</p>
          <a class="btn" routerLink="/agendar">Agendar agora</a>
        </div>
      }

      @if (upcoming().length > 0) {
        <h2 class="mt">Próximos</h2>
        <div class="grid cols-2">
          @for (a of upcoming(); track a.id) {
            <div class="card appt">
              <div class="spread">
                <h3>{{ a.serviceName }}</h3>
                <span class="badge" [class]="a.status">{{
                  statusLabel(a.status)
                }}</span>
              </div>
              <p class="dim small">
                {{ formatWhen(a.startAt) }} • {{ a.durationMin }} min
              </p>
              <p class="dim small">
                {{ price(a.priceCents) }}
                @if (a.notes) {
                  • Obs.: {{ a.notes }}
                }
              </p>
              @if (hoursUntil(a) <= 24 && a.status !== 'cancelled') {
                <div class="reminder">
                  🔔 Lembrete: seu corte é em {{ humanHours(a) }}. Chegue 5 min
                  antes!
                </div>
              }
              <div class="row actions">
                @if (appt.canClientCancel(a)) {
                  <button
                    class="btn outline sm"
                    type="button"
                    (click)="cancel(a)"
                  >
                    Cancelar
                  </button>
                } @else if (a.status !== 'cancelled' && a.status !== 'completed') {
                  <span class="dim small">
                    ⏳ Fora do prazo para cancelar on-line. Fale com o barbeiro.
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (past().length > 0) {
        <h2 class="mt">Histórico</h2>
        <div class="grid cols-2">
          @for (a of past(); track a.id) {
            <div class="card appt past">
              <div class="spread">
                <h3>{{ a.serviceName }}</h3>
                <span class="badge" [class]="a.status">{{
                  statusLabel(a.status)
                }}</span>
              </div>
              <p class="dim small">
                {{ formatWhen(a.startAt) }} • {{ price(a.priceCents) }}
              </p>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .section {
        padding: 40px 0 60px;
      }
      .mt {
        margin-top: 32px;
      }
      .empty {
        margin-top: 24px;
        text-align: center;
        padding: 50px 24px;
      }
      .empty h3 {
        margin-bottom: 6px;
      }
      .empty .btn {
        margin-top: 14px;
      }
      .appt h3 {
        margin: 0;
      }
      .appt.past {
        opacity: 0.75;
      }
      .reminder {
        margin: 10px 0 12px;
        padding: 10px 12px;
        background: var(--accent-soft);
        border: 1px solid rgba(217, 164, 65, 0.3);
        color: var(--accent);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
      }
      .actions {
        margin-top: 6px;
      }
    `,
  ],
})
export class ClientDashboardComponent {
  auth = inject(AuthService);
  appt = inject(AppointmentService);
  private data = inject(DataService);
  private n = inject(NotificationService);

  private myAppointments = computed<Appointment[]>(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    return this.data.appointmentsForClient(user.id);
  });

  upcoming = computed(() =>
    this.myAppointments().filter(
      (a) => new Date(a.startAt).getTime() >= Date.now() && a.status !== 'cancelled',
    ),
  );

  past = computed(() =>
    this.myAppointments()
      .filter(
        (a) =>
          new Date(a.startAt).getTime() < Date.now() || a.status === 'cancelled',
      )
      .reverse(),
  );

  statusLabel(s: string) {
    return (
      {
        pending: 'Aguardando',
        confirmed: 'Confirmado',
        cancelled: 'Cancelado',
        completed: 'Realizado',
      } as Record<string, string>
    )[s] ?? s;
  }

  hoursUntil(a: Appointment) {
    return this.appt.hoursUntil(a);
  }

  humanHours(a: Appointment) {
    const h = this.appt.hoursUntil(a);
    if (h < 1) return `${Math.max(0, Math.round(h * 60))} min`;
    if (h < 24) return `${Math.round(h)} h`;
    return `${Math.round(h / 24)} dias`;
  }

  formatWhen(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }) + ' • ' + d.toTimeString().slice(0, 5);
  }

  price(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  cancel(a: Appointment) {
    try {
      this.appt.cancelAsClient(a);
      this.n.success('Agendamento cancelado.');
    } catch (e) {
      this.n.error(e instanceof Error ? e.message : 'Erro ao cancelar.');
    }
  }
}
