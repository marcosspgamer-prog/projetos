import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Service } from '../../models';
import {
  AppointmentService,
  TimeSlot,
} from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="container section">
      <h1>Agendar horário</h1>
      <p class="dim">
        Escolha o serviço, o dia e um horário disponível. Você recebe a
        confirmação em segundos.
      </p>

      <div class="steps">
        <!-- 1. Serviço -->
        <div class="card step">
          <div class="row step-head">
            <span class="step-num">1</span>
            <h3>Serviço</h3>
          </div>
          <div class="service-list">
            @for (svc of data.barber().services; track svc.id) {
              <button
                type="button"
                class="service-item"
                [class.active]="selectedService()?.id === svc.id"
                (click)="selectService(svc)"
              >
                <div class="spread">
                  <strong>{{ svc.name }}</strong>
                  <span class="price">{{ price(svc.priceCents) }}</span>
                </div>
                <div class="spread small dim">
                  <span>{{ svc.description }}</span>
                  <span>⏱ {{ svc.durationMin }} min</span>
                </div>
              </button>
            }
          </div>
        </div>

        <!-- 2. Data -->
        <div class="card step" [class.disabled]="!selectedService()">
          <div class="row step-head">
            <span class="step-num">2</span>
            <h3>Data</h3>
          </div>
          <div class="days-row">
            @for (d of upcomingDays(); track d.iso) {
              <button
                type="button"
                class="day"
                [class.active]="selectedDate() === d.iso"
                [class.closed]="!d.open"
                [disabled]="!d.open"
                (click)="selectDate(d.iso)"
              >
                <span class="wd">{{ d.weekday }}</span>
                <span class="num">{{ d.day }}</span>
                <span class="mo">{{ d.month }}</span>
              </button>
            }
          </div>
        </div>

        <!-- 3. Horário -->
        <div
          class="card step"
          [class.disabled]="!selectedService() || !selectedDate()"
        >
          <div class="row step-head">
            <span class="step-num">3</span>
            <h3>Horário</h3>
          </div>
          @if (slots().length === 0) {
            <p class="dim small">
              Selecione um serviço e um dia para ver os horários disponíveis.
            </p>
          } @else {
            <div class="slots">
              @for (s of slots(); track s.startAt) {
                <button
                  type="button"
                  class="slot"
                  [class.active]="selectedSlot()?.startAt === s.startAt"
                  [disabled]="!s.available"
                  (click)="selectSlot(s)"
                >
                  {{ s.label }}
                </button>
              }
            </div>
          }
        </div>

        <!-- 4. Confirmação -->
        <div class="card step" [class.disabled]="!canConfirm()">
          <div class="row step-head">
            <span class="step-num">4</span>
            <h3>Confirmação</h3>
          </div>
          @if (canConfirm()) {
            <ul class="summary">
              <li>
                <span class="dim">Serviço</span>
                <strong>{{ selectedService()?.name }}</strong>
              </li>
              <li>
                <span class="dim">Quando</span>
                <strong>{{ formatWhen() }}</strong>
              </li>
              <li>
                <span class="dim">Duração</span>
                <strong>{{ selectedService()?.durationMin }} min</strong>
              </li>
              <li>
                <span class="dim">Valor</span>
                <strong>{{ price(selectedService()!.priceCents) }}</strong>
              </li>
            </ul>

            <div class="form-row">
              <label>Observação para o barbeiro (opcional)</label>
              <textarea
                [(ngModel)]="notes"
                name="notes"
                placeholder="Ex.: quero só aparar, baixo na lateral..."
              ></textarea>
            </div>

            <p class="dim small">
              Lembrete da casa: cancelamentos precisam ser feitos com no mínimo
              <strong>{{ minHours }} horas</strong> de antecedência.
            </p>

            <button class="btn block" type="button" (click)="confirm()">
              Confirmar agendamento
            </button>
          } @else {
            <p class="dim small">
              Complete os passos acima para confirmar.
            </p>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .section {
        padding: 40px 0 60px;
      }
      .steps {
        display: grid;
        gap: 18px;
        margin-top: 22px;
      }
      .step.disabled {
        opacity: 0.5;
        pointer-events: none;
      }
      .step-head {
        margin-bottom: 14px;
      }
      .step-num {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--accent);
        color: #1a1406;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.9rem;
      }
      .step h3 {
        margin: 0;
      }
      .service-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      @media (max-width: 680px) {
        .service-list {
          grid-template-columns: 1fr;
        }
      }
      .service-item {
        text-align: left;
        padding: 14px 16px;
        background: var(--bg-elev);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        color: var(--text);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 6px;
        transition: border-color 0.1s ease;
      }
      .service-item:hover {
        border-color: var(--accent);
      }
      .service-item.active {
        border-color: var(--accent);
        background: var(--accent-soft);
      }
      .price {
        color: var(--accent);
        font-weight: 700;
      }
      .days-row {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 8px;
        scrollbar-width: thin;
      }
      .day {
        flex: 0 0 72px;
        background: var(--bg-elev);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 10px 6px;
        color: var(--text);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }
      .day:hover:not(:disabled) {
        border-color: var(--accent);
      }
      .day.active {
        background: var(--accent);
        color: #1a1406;
        border-color: var(--accent);
      }
      .day.closed,
      .day:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .day .wd {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.8;
      }
      .day .num {
        font-size: 1.3rem;
        font-weight: 700;
      }
      .day .mo {
        font-size: 0.7rem;
        text-transform: uppercase;
        opacity: 0.8;
      }
      .slots {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 8px;
      }
      .slot {
        background: var(--bg-elev);
        border: 1px solid var(--border);
        color: var(--text);
        padding: 10px 6px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-weight: 600;
      }
      .slot:hover:not(:disabled) {
        border-color: var(--accent);
      }
      .slot.active {
        background: var(--accent);
        color: #1a1406;
        border-color: var(--accent);
      }
      .slot:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .summary {
        list-style: none;
        padding: 0;
        margin: 0 0 16px;
        display: grid;
        gap: 8px;
      }
      .summary li {
        display: flex;
        justify-content: space-between;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border);
      }
      .summary li:last-child {
        border-bottom: none;
      }
    `,
  ],
})
export class BookingComponent {
  protected data = inject(DataService);
  private appt = inject(AppointmentService);
  private auth = inject(AuthService);
  private n = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly minHours = this.appt.minCancelHours();

  selectedService = signal<Service | null>(null);
  selectedDate = signal<string | null>(null);
  selectedSlot = signal<TimeSlot | null>(null);
  notes = '';

  constructor() {
    // Pre-selecionar serviço vindo do ?service=
    const preId = this.route.snapshot.queryParamMap.get('service');
    if (preId) {
      const svc = this.data.barber().services.find((s) => s.id === preId);
      if (svc) this.selectedService.set(svc);
    }
  }

  upcomingDays = computed(() => {
    const list: Array<{
      iso: string;
      weekday: string;
      day: string;
      month: string;
      open: boolean;
    }> = [];
    const wh = this.data.barber().workingHours;
    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const wd = d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      list.push({
        iso: d.toISOString().slice(0, 10),
        weekday: weekdayNames[wd],
        day: String(d.getDate()).padStart(2, '0'),
        month: monthNames[d.getMonth()],
        open: wh[wd].open,
      });
    }
    return list;
  });

  slots = computed<TimeSlot[]>(() => {
    const svc = this.selectedService();
    const date = this.selectedDate();
    if (!svc || !date) return [];
    return this.appt.slotsForDay(date, svc);
  });

  canConfirm = computed(
    () =>
      !!this.selectedService() &&
      !!this.selectedDate() &&
      !!this.selectedSlot() &&
      !!this.selectedSlot()?.available,
  );

  selectService(svc: Service) {
    this.selectedService.set(svc);
    this.selectedSlot.set(null);
  }

  selectDate(iso: string) {
    this.selectedDate.set(iso);
    this.selectedSlot.set(null);
  }

  selectSlot(s: TimeSlot) {
    this.selectedSlot.set(s);
  }

  price(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  formatWhen(): string {
    const s = this.selectedSlot();
    if (!s) return '';
    const d = new Date(s.startAt);
    return (
      d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }) +
      ' • ' +
      d.toTimeString().slice(0, 5)
    );
  }

  confirm() {
    const user = this.auth.currentUser();
    if (!user) {
      this.n.info('Faça login (ou crie sua conta) para concluir o agendamento.');
      this.router.navigate(['/login'], {
        queryParams: { redirect: 'booking' },
      });
      return;
    }
    if (user.role === 'barber') {
      this.n.warning('Agendamentos são feitos por clientes.');
      return;
    }
    try {
      const slot = this.selectedSlot()!;
      const svc = this.selectedService()!;
      this.appt.book({
        client: user,
        service: svc,
        startAtISO: slot.startAt,
        notes: this.notes,
      });
      this.n.success('Agendamento criado! Você receberá um lembrete antes.');
      this.router.navigate(['/minha-conta']);
    } catch (e) {
      this.n.error(e instanceof Error ? e.message : 'Erro ao agendar.');
    }
  }
}
