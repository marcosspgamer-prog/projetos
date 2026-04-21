import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Appointment,
  AppointmentStatus,
  BarberProfile,
  GalleryItem,
  Service,
} from '../../models';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { DataService, newId } from '../../services/data.service';
import { NotificationService } from '../../services/notification.service';

type Tab = 'agenda' | 'clientes' | 'perfil';

@Component({
  selector: 'app-barber-dashboard',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="container section">
      <div class="spread">
        <div>
          <h1>Painel do barbeiro</h1>
          <p class="dim">
            Bem-vindo, <strong>{{ auth.currentUser()?.name }}</strong>. Veja sua
            agenda, clientes e atualize seu perfil.
          </p>
        </div>
        <div class="row">
          <div class="kpi">
            <span class="kpi-num">{{ kpis().hoje }}</span>
            <span class="kpi-label">Hoje</span>
          </div>
          <div class="kpi">
            <span class="kpi-num">{{ kpis().pendentes }}</span>
            <span class="kpi-label">Pendentes</span>
          </div>
          <div class="kpi">
            <span class="kpi-num">{{ kpis().semana }}</span>
            <span class="kpi-label">Na semana</span>
          </div>
        </div>
      </div>

      <nav class="tabs">
        <button
          class="tab"
          [class.active]="tab() === 'agenda'"
          (click)="tab.set('agenda')"
        >
          Agenda
        </button>
        <button
          class="tab"
          [class.active]="tab() === 'clientes'"
          (click)="tab.set('clientes')"
        >
          Clientes
        </button>
        <button
          class="tab"
          [class.active]="tab() === 'perfil'"
          (click)="tab.set('perfil')"
        >
          Meu perfil
        </button>
      </nav>

      @if (tab() === 'agenda') {
        <div class="agenda">
          @if (appointments().length === 0) {
            <div class="card empty">
              <h3>Sem agendamentos ainda.</h3>
              <p class="dim">
                Assim que um cliente marcar pelo site, ele aparece aqui.
              </p>
            </div>
          }
          @for (group of grouped(); track group.dayKey) {
            <h3 class="day-title">{{ group.label }}</h3>
            <div class="grid cols-2">
              @for (a of group.items; track a.id) {
                <div class="card appt">
                  <div class="spread">
                    <div>
                      <h3>{{ a.serviceName }}</h3>
                      <p class="dim small">
                        {{ time(a.startAt) }} – {{ time(a.endAt) }} •
                        {{ a.durationMin }} min
                      </p>
                    </div>
                    <span class="badge" [class]="a.status">
                      {{ statusLabel(a.status) }}
                    </span>
                  </div>
                  <p class="small">
                    <strong>{{ a.clientName }}</strong>
                    @if (a.clientPhone) {
                      <span class="dim"> • {{ a.clientPhone }}</span>
                    }
                  </p>
                  @if (a.notes) {
                    <p class="dim small">Obs.: {{ a.notes }}</p>
                  }
                  <div class="row actions">
                    @if (a.status === 'pending') {
                      <button
                        class="btn sm"
                        type="button"
                        (click)="confirm(a)"
                      >
                        Confirmar
                      </button>
                    }
                    @if (
                      a.status === 'pending' || a.status === 'confirmed'
                    ) {
                      <button
                        class="btn outline sm"
                        type="button"
                        (click)="complete(a)"
                      >
                        Marcar realizado
                      </button>
                      <button
                        class="btn ghost sm"
                        type="button"
                        (click)="cancel(a)"
                      >
                        Cancelar
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (tab() === 'clientes') {
        <div class="clientes">
          @if (clients().length === 0) {
            <div class="card empty">
              <h3>Nenhum cliente ainda.</h3>
              <p class="dim">
                Seus clientes aparecem aqui conforme fazem o primeiro
                agendamento.
              </p>
            </div>
          } @else {
            <div class="grid cols-2">
              @for (c of clients(); track c.name) {
                <div class="card">
                  <div class="spread">
                    <h3>{{ c.name }}</h3>
                    <span class="badge">{{ c.count }} cortes</span>
                  </div>
                  @if (c.phone) {
                    <p class="dim small">📱 {{ c.phone }}</p>
                  }
                  <p class="dim small">
                    Último atendimento: {{ formatDate(c.lastAt) }}
                  </p>
                  <p class="dim small">
                    Favorito: <strong>{{ c.favorite }}</strong>
                  </p>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (tab() === 'perfil') {
        <div class="perfil">
          <div class="grid cols-2">
            <div class="card">
              <h3>Identidade</h3>
              <div class="form-row">
                <label>Nome da barbearia</label>
                <input [(ngModel)]="draft.displayName" />
              </div>
              <div class="form-row">
                <label>Tagline</label>
                <input [(ngModel)]="draft.tagline" />
              </div>
              <div class="form-row">
                <label>Bio</label>
                <textarea [(ngModel)]="draft.bio"></textarea>
              </div>
              <div class="form-row">
                <label>Endereço</label>
                <input [(ngModel)]="draft.address" />
              </div>
              <div class="form-row">
                <label>Telefone</label>
                <input [(ngModel)]="draft.phone" />
              </div>
              <div class="form-row">
                <label>Instagram</label>
                <input [(ngModel)]="draft.instagram" />
              </div>
              <div class="form-row">
                <label>Foto de perfil (URL)</label>
                <input [(ngModel)]="draft.avatarUrl" />
              </div>
              <div class="form-row">
                <label>Foto de capa (URL)</label>
                <input [(ngModel)]="draft.coverUrl" />
              </div>
            </div>

            <div class="card">
              <h3>Horário de atendimento</h3>
              @for (d of weekdays; track d.idx) {
                <div class="hours-row">
                  <label class="spread">
                    <span>{{ d.label }}</span>
                    <input
                      type="checkbox"
                      [(ngModel)]="draft.workingHours[d.idx].open"
                    />
                  </label>
                  <div
                    class="row"
                    [class.disabled]="!draft.workingHours[d.idx].open"
                  >
                    <input
                      type="time"
                      [(ngModel)]="draft.workingHours[d.idx].start"
                    />
                    <span class="dim">até</span>
                    <input
                      type="time"
                      [(ngModel)]="draft.workingHours[d.idx].end"
                    />
                  </div>
                </div>
              }
              <div class="form-row mt">
                <label>Duração mínima de slot (min)</label>
                <input type="number" min="10" [(ngModel)]="draft.slotMinutes" />
              </div>
            </div>
          </div>

          <div class="card mt">
            <div class="spread">
              <h3>Serviços oferecidos</h3>
              <button
                type="button"
                class="btn outline sm"
                (click)="addService()"
              >
                Adicionar serviço
              </button>
            </div>
            <div class="grid cols-2">
              @for (svc of draft.services; track svc.id) {
                <div class="service-edit">
                  <div class="form-row">
                    <label>Nome</label>
                    <input [(ngModel)]="svc.name" [name]="'n-' + svc.id" />
                  </div>
                  <div class="form-row">
                    <label>Descrição</label>
                    <input
                      [(ngModel)]="svc.description"
                      [name]="'d-' + svc.id"
                    />
                  </div>
                  <div class="row">
                    <div class="form-row" style="flex:1">
                      <label>Duração (min)</label>
                      <input
                        type="number"
                        [(ngModel)]="svc.durationMin"
                        [name]="'dur-' + svc.id"
                      />
                    </div>
                    <div class="form-row" style="flex:1">
                      <label>Preço (R$)</label>
                      <input
                        type="number"
                        step="0.5"
                        [ngModel]="svc.priceCents / 100"
                        (ngModelChange)="svc.priceCents = $event * 100"
                        [name]="'p-' + svc.id"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn ghost sm"
                    (click)="removeService(svc)"
                  >
                    Remover
                  </button>
                </div>
              }
            </div>
          </div>

          <div class="card mt">
            <div class="spread">
              <h3>Galeria</h3>
              <button
                type="button"
                class="btn outline sm"
                (click)="addGallery()"
              >
                Adicionar foto
              </button>
            </div>
            <div class="grid cols-3 gallery-edit">
              @for (g of draft.gallery; track g.id) {
                <div class="gallery-item">
                  @if (g.url) {
                    <img [src]="g.url" alt="" />
                  }
                  <div class="form-row">
                    <label>URL da imagem</label>
                    <input [(ngModel)]="g.url" [name]="'u-' + g.id" />
                  </div>
                  <div class="form-row">
                    <label>Legenda</label>
                    <input [(ngModel)]="g.caption" [name]="'c-' + g.id" />
                  </div>
                  <button
                    type="button"
                    class="btn ghost sm"
                    (click)="removeGallery(g)"
                  >
                    Remover
                  </button>
                </div>
              }
            </div>
          </div>

          <div class="row save-row">
            <button type="button" class="btn" (click)="save()">
              Salvar alterações
            </button>
            <button type="button" class="btn ghost" (click)="reset()">
              Descartar
            </button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .section {
        padding: 40px 0 60px;
      }
      .kpi {
        padding: 10px 18px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .kpi-num {
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--accent);
      }
      .kpi-label {
        font-size: 0.75rem;
        color: var(--text-mute);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .tabs {
        display: flex;
        gap: 4px;
        background: var(--bg-elev);
        padding: 4px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
        margin: 24px 0;
        width: fit-content;
      }
      .tab {
        background: transparent;
        color: var(--text-dim);
        border: none;
        padding: 9px 16px;
        border-radius: calc(var(--radius-sm) - 2px);
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
      }
      .tab.active {
        background: var(--bg-card);
        color: var(--text);
      }
      .empty {
        text-align: center;
        padding: 50px 24px;
      }
      .day-title {
        margin: 22px 0 10px;
        color: var(--text-dim);
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .appt h3 {
        margin: 0;
      }
      .actions {
        margin-top: 10px;
      }
      .mt {
        margin-top: 22px;
      }
      .hours-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--border);
      }
      .hours-row label {
        margin: 0;
      }
      .hours-row .row.disabled {
        opacity: 0.4;
        pointer-events: none;
      }
      .service-edit {
        background: var(--bg-elev);
        padding: 16px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
      }
      .gallery-edit .gallery-item {
        background: var(--bg-elev);
        padding: 12px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
      }
      .gallery-item img {
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        border-radius: 6px;
        margin-bottom: 10px;
      }
      .save-row {
        margin-top: 24px;
        justify-content: flex-end;
      }
    `,
  ],
})
export class BarberDashboardComponent {
  auth = inject(AuthService);
  private data = inject(DataService);
  private apptSvc = inject(AppointmentService);
  private n = inject(NotificationService);

  tab = signal<Tab>('agenda');
  readonly weekdays: Array<{
    idx: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    label: string;
  }> = [
    { idx: 0, label: 'Domingo' },
    { idx: 1, label: 'Segunda' },
    { idx: 2, label: 'Terça' },
    { idx: 3, label: 'Quarta' },
    { idx: 4, label: 'Quinta' },
    { idx: 5, label: 'Sexta' },
    { idx: 6, label: 'Sábado' },
  ];

  draft: BarberProfile = structuredClone(this.data.barber());

  appointments = computed(() => this.data.appointmentsForBarber());

  kpis = computed(() => {
    const all = this.appointments();
    const today = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + 7);
    const isSameDay = (d: Date) =>
      d.toDateString() === today.toDateString();
    return {
      hoje: all.filter(
        (a) => isSameDay(new Date(a.startAt)) && a.status !== 'cancelled',
      ).length,
      pendentes: all.filter((a) => a.status === 'pending').length,
      semana: all.filter((a) => {
        const d = new Date(a.startAt);
        return (
          d.getTime() >= today.getTime() &&
          d.getTime() <= endOfWeek.getTime() &&
          a.status !== 'cancelled'
        );
      }).length,
    };
  });

  grouped = computed(() => {
    const byDay = new Map<string, Appointment[]>();
    for (const a of this.appointments()) {
      const key = a.startAt.slice(0, 10);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(a);
    }
    return Array.from(byDay.entries()).map(([dayKey, items]) => {
      const d = new Date(dayKey + 'T00:00:00');
      const label = d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });
      return { dayKey, label, items };
    });
  });

  clients = computed(() => {
    const map = new Map<
      string,
      { name: string; phone?: string; count: number; lastAt: string; favorite: string }
    >();
    const svcCounter: Record<string, Record<string, number>> = {};
    for (const a of this.appointments()) {
      if (a.status === 'cancelled') continue;
      const key = a.clientId;
      const current = map.get(key);
      if (!current) {
        map.set(key, {
          name: a.clientName,
          phone: a.clientPhone,
          count: 1,
          lastAt: a.startAt,
          favorite: a.serviceName,
        });
      } else {
        current.count += 1;
        if (a.startAt > current.lastAt) current.lastAt = a.startAt;
      }
      svcCounter[key] ??= {};
      svcCounter[key][a.serviceName] = (svcCounter[key][a.serviceName] ?? 0) + 1;
    }
    for (const [key, value] of map) {
      const counts = svcCounter[key] ?? {};
      const favorite = Object.entries(counts).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0];
      if (favorite) value.favorite = favorite;
    }
    return Array.from(map.values()).sort((a, b) =>
      b.lastAt.localeCompare(a.lastAt),
    );
  });

  confirm(a: Appointment) {
    this.apptSvc.confirm(a.id);
    this.n.success('Agendamento confirmado — avise o cliente! 🔔');
  }

  complete(a: Appointment) {
    this.apptSvc.complete(a.id);
    this.n.success('Atendimento marcado como realizado.');
  }

  cancel(a: Appointment) {
    this.apptSvc.cancelAsBarber(a);
    this.n.warning('Agendamento cancelado pelo barbeiro.');
  }

  time(iso: string) {
    return new Date(iso).toTimeString().slice(0, 5);
  }

  formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  statusLabel(s: AppointmentStatus) {
    return (
      {
        pending: 'Aguardando',
        confirmed: 'Confirmado',
        cancelled: 'Cancelado',
        completed: 'Realizado',
      }[s] ?? s
    );
  }

  addService() {
    const s: Service = {
      id: 'svc-' + newId(),
      name: 'Novo serviço',
      description: '',
      durationMin: 30,
      priceCents: 4000,
    };
    this.draft.services = [...this.draft.services, s];
  }

  removeService(svc: Service) {
    this.draft.services = this.draft.services.filter((s) => s.id !== svc.id);
  }

  addGallery() {
    const g: GalleryItem = {
      id: 'g-' + newId(),
      url: '',
      caption: '',
    };
    this.draft.gallery = [...this.draft.gallery, g];
  }

  removeGallery(g: GalleryItem) {
    this.draft.gallery = this.draft.gallery.filter((x) => x.id !== g.id);
  }

  save() {
    this.data.saveBarber(structuredClone(this.draft));
    this.n.success('Perfil atualizado!');
  }

  reset() {
    this.draft = structuredClone(this.data.barber());
    this.n.info('Alterações descartadas.');
  }
}
