import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="nav">
      <div class="container nav-inner">
        <a routerLink="/" class="brand">
          <span class="logo-mark">✂</span>
          <span class="logo-text">{{ data.barber().displayName }}</span>
        </a>

        <nav class="links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Sobre
          </a>
          <a routerLink="/agendar" routerLinkActive="active">Agendar</a>
          @if (auth.isClient()) {
            <a routerLink="/minha-conta" routerLinkActive="active">Meus cortes</a>
          }
          @if (auth.isBarber()) {
            <a routerLink="/barbeiro" routerLinkActive="active">Painel</a>
          }
        </nav>

        <div class="actions">
          @if (!auth.isLoggedIn()) {
            <a class="btn outline sm" routerLink="/login">Entrar</a>
            <a class="btn sm" routerLink="/agendar">Agendar agora</a>
          } @else {
            <span class="who">
              Olá,
              <strong>{{ auth.currentUser()?.name }}</strong>
            </span>
            <button class="btn ghost sm" (click)="auth.logout()">Sair</button>
          }
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .nav {
        position: sticky;
        top: 0;
        z-index: 50;
        background: rgba(14, 13, 11, 0.85);
        backdrop-filter: saturate(150%) blur(10px);
        border-bottom: 1px solid var(--border);
      }
      .nav-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding-top: 14px;
        padding-bottom: 14px;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--text);
        text-decoration: none;
        font-weight: 700;
      }
      .logo-mark {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--accent);
        color: #1a1406;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
      }
      .logo-text {
        font-family: 'Playfair Display', serif;
        font-size: 1.15rem;
      }
      .links {
        display: flex;
        gap: 22px;
        font-size: 0.95rem;
      }
      .links a {
        color: var(--text-dim);
        padding: 6px 2px;
        border-bottom: 2px solid transparent;
        text-decoration: none;
      }
      .links a:hover {
        color: var(--text);
      }
      .links a.active {
        color: var(--text);
        border-bottom-color: var(--accent);
      }
      .actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .who {
        color: var(--text-dim);
        font-size: 0.9rem;
      }
      .who strong {
        color: var(--text);
      }
      @media (max-width: 760px) {
        .links {
          display: none;
        }
        .logo-text {
          display: none;
        }
        .who {
          display: none;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  auth = inject(AuthService);
  data = inject(DataService);
}
