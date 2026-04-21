import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section
      class="hero"
      [style.backgroundImage]="'linear-gradient(180deg, rgba(14,13,11,0.45), rgba(14,13,11,0.95)), url(' + barber().coverUrl + ')'"
    >
      <div class="container hero-inner">
        <span class="tag">Barbearia • Santo André</span>
        <h1>{{ barber().displayName }}</h1>
        <p class="tagline">{{ barber().tagline }}</p>
        <div class="row hero-actions">
          <a class="btn" routerLink="/agendar">Agendar horário</a>
          <a class="btn outline" href="#sobre">Conhecer a barbearia</a>
        </div>
        <div class="hero-meta row">
          <span>★ 4.9 (312 avaliações)</span>
          <span>•</span>
          <span>{{ barber().address }}</span>
        </div>
      </div>
    </section>

    <section id="sobre" class="container section">
      <div class="grid cols-2 about">
        <div>
          <h2>Sobre o profissional</h2>
          <p>{{ barber().bio }}</p>
          <ul class="info-list">
            <li><strong>Endereço</strong> {{ barber().address }}</li>
            <li><strong>Telefone</strong> {{ barber().phone }}</li>
            @if (barber().instagram) {
              <li><strong>Instagram</strong> {{ barber().instagram }}</li>
            }
          </ul>
        </div>
        <div class="hours card">
          <h3>Horário de atendimento</h3>
          <table>
            <tbody>
              @for (row of hoursRows(); track row.label) {
                <tr [class.closed]="!row.open">
                  <td>{{ row.label }}</td>
                  <td>
                    @if (row.open) {
                      {{ row.start }} – {{ row.end }}
                    } @else {
                      Fechado
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="container section">
      <div class="spread">
        <h2>Serviços</h2>
        <a class="btn outline sm" routerLink="/agendar">Ver agenda</a>
      </div>
      <div class="grid cols-2 services">
        @for (svc of barber().services; track svc.id) {
          <div class="service-card card">
            <div class="spread">
              <h3>{{ svc.name }}</h3>
              <span class="price">{{ formatPrice(svc.priceCents) }}</span>
            </div>
            @if (svc.description) {
              <p class="dim small">{{ svc.description }}</p>
            }
            <div class="spread small">
              <span class="mute">⏱ {{ svc.durationMin }} min</span>
              <a class="btn sm" [routerLink]="['/agendar']" [queryParams]="{ service: svc.id }">
                Agendar
              </a>
            </div>
          </div>
        }
      </div>
    </section>

    <section class="container section">
      <h2>Galeria de cortes</h2>
      <div class="gallery">
        @for (g of barber().gallery; track g.id) {
          <figure>
            <img [src]="g.url" [alt]="g.caption ?? ''" loading="lazy" />
            @if (g.caption) {
              <figcaption>{{ g.caption }}</figcaption>
            }
          </figure>
        }
      </div>
    </section>

    <section class="container section cta">
      <div class="card cta-card">
        <div>
          <h2>Pronto pro próximo corte?</h2>
          <p class="dim">
            Agende em 30 segundos. Você escolhe o serviço, o dia e o horário — e
            nós te lembramos antes do atendimento.
          </p>
        </div>
        <a class="btn" routerLink="/agendar">Agendar agora</a>
      </div>
    </section>
  `,
  styles: [
    `
      .hero {
        min-height: 520px;
        background-size: cover;
        background-position: center;
        display: flex;
        align-items: center;
        padding: 80px 0 60px;
        border-bottom: 1px solid var(--border);
      }
      .hero-inner {
        max-width: 760px;
      }
      .tag {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 14px;
      }
      .tagline {
        font-size: 1.15rem;
        color: var(--text-dim);
        margin-bottom: 22px;
        max-width: 580px;
      }
      .hero-actions {
        margin-bottom: 28px;
      }
      .hero-meta {
        color: var(--text-dim);
        font-size: 0.95rem;
      }
      .section {
        padding: 60px 0 20px;
      }
      .about h2 {
        margin-bottom: 18px;
      }
      .info-list {
        list-style: none;
        padding: 0;
        margin: 22px 0 0;
        display: grid;
        gap: 10px;
      }
      .info-list li {
        color: var(--text-dim);
      }
      .info-list strong {
        color: var(--text);
        display: inline-block;
        min-width: 100px;
      }
      .hours table {
        width: 100%;
        border-collapse: collapse;
      }
      .hours td {
        padding: 8px 0;
        border-bottom: 1px solid var(--border);
        color: var(--text-dim);
      }
      .hours td:first-child {
        color: var(--text);
        font-weight: 500;
      }
      .hours tr:last-child td {
        border-bottom: none;
      }
      .hours tr.closed td {
        color: var(--text-mute);
      }
      .services {
        margin-top: 24px;
      }
      .service-card .price {
        color: var(--accent);
        font-weight: 700;
        font-size: 1.1rem;
      }
      .service-card h3 {
        margin: 0;
      }
      .service-card p {
        margin: 10px 0 14px;
      }
      .gallery {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-top: 20px;
      }
      .gallery figure {
        margin: 0;
        position: relative;
        overflow: hidden;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        aspect-ratio: 4 / 5;
      }
      .gallery img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }
      .gallery figure:hover img {
        transform: scale(1.04);
      }
      .gallery figcaption {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 10px 14px;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        color: #fff;
        font-size: 0.85rem;
      }
      @media (max-width: 800px) {
        .gallery {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 480px) {
        .gallery {
          grid-template-columns: 1fr;
        }
      }
      .cta-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        flex-wrap: wrap;
      }
      .cta-card h2 {
        margin: 0 0 8px;
      }
      .cta-card p {
        margin: 0;
        max-width: 560px;
      }
    `,
  ],
})
export class LandingComponent {
  private data = inject(DataService);
  barber = this.data.barber;

  readonly weekdayLabels = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ];

  hoursRows = computed(() => {
    const wh = this.barber().workingHours;
    return this.weekdayLabels.map((label, idx) => ({
      label,
      ...wh[idx as 0 | 1 | 2 | 3 | 4 | 5 | 6],
    }));
  });

  formatPrice(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}
