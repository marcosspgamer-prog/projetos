import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

type Mode = 'login' | 'register';
type Role = 'client' | 'barber';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="auth-wrap container">
      <div class="card auth-card">
        <div class="tabs">
          <button
            class="tab"
            [class.active]="mode() === 'login'"
            (click)="setMode('login')"
          >
            Entrar
          </button>
          <button
            class="tab"
            [class.active]="mode() === 'register'"
            (click)="setMode('register')"
          >
            Criar conta
          </button>
        </div>

        <h2 class="mt">
          @if (mode() === 'login') {
            Bem-vindo de volta
          } @else {
            Crie sua conta
          }
        </h2>
        <p class="dim small">
          @if (mode() === 'login') {
            Acesse seus agendamentos e histórico de cortes.
          } @else {
            Leva menos de 30 segundos. Só precisamos do seu contato.
          }
        </p>

        <div class="social">
          <button
            type="button"
            class="btn outline block social-btn"
            (click)="social('google')"
          >
            <span class="social-ico" aria-hidden="true">G</span>
            Continuar com Google
          </button>
          <button
            type="button"
            class="btn outline block social-btn"
            (click)="social('apple')"
          >
            <span class="social-ico" aria-hidden="true"></span>
            Continuar com Apple
          </button>
        </div>
        <div class="or">
          <span>ou com e-mail</span>
        </div>

        <form (submit)="submit($event)">
          @if (mode() === 'register') {
            <div class="form-row">
              <label>Nome completo</label>
              <input
                name="name"
                [(ngModel)]="name"
                required
                autocomplete="name"
              />
            </div>
            <div class="form-row">
              <label>Telefone (WhatsApp)</label>
              <input
                name="phone"
                [(ngModel)]="phone"
                placeholder="+55 11 99999-0000"
                autocomplete="tel"
              />
            </div>
            <div class="form-row">
              <label>Eu sou...</label>
              <div class="role-toggle">
                <label [class.active]="role() === 'client'">
                  <input
                    type="radio"
                    name="role"
                    value="client"
                    [checked]="role() === 'client'"
                    (change)="role.set('client')"
                  />
                  Cliente
                </label>
                <label [class.active]="role() === 'barber'">
                  <input
                    type="radio"
                    name="role"
                    value="barber"
                    [checked]="role() === 'barber'"
                    (change)="role.set('barber')"
                  />
                  Barbeiro
                </label>
              </div>
            </div>
          }
          <div class="form-row">
            <label>E-mail</label>
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              autocomplete="email"
            />
          </div>
          <div class="form-row">
            <label>Senha</label>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              autocomplete="current-password"
              minlength="4"
            />
          </div>

          <button class="btn block" type="submit">
            @if (mode() === 'login') {
              Entrar
            } @else {
              Criar conta
            }
          </button>

          @if (mode() === 'login') {
            <p class="dim small mt-sm">
              Demo: <code>cliente&#64;demo.com</code> / <code>demo123</code>
              &nbsp;•&nbsp;
              <code>tony&#64;barbearia.com</code> / <code>tony123</code>
            </p>
          }
        </form>
      </div>

      <aside class="card side">
        <h3>Por que cadastrar?</h3>
        <ul class="perks">
          <li>📅 Agenda sempre atualizada — sem ligações.</li>
          <li>🔔 Lembretes automáticos do seu horário.</li>
          <li>✂ Histórico dos seus cortes favoritos.</li>
          <li>✅ Cancelamento fácil (até 2h antes).</li>
        </ul>
      </aside>
    </div>
  `,
  styles: [
    `
      .auth-wrap {
        display: grid;
        grid-template-columns: minmax(320px, 440px) 1fr;
        gap: 30px;
        align-items: flex-start;
        padding-top: 50px;
        padding-bottom: 60px;
      }
      @media (max-width: 900px) {
        .auth-wrap {
          grid-template-columns: 1fr;
        }
      }
      .auth-card {
        padding: 28px;
      }
      .tabs {
        display: flex;
        gap: 4px;
        background: var(--bg-elev);
        padding: 4px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
      }
      .tab {
        flex: 1;
        background: transparent;
        color: var(--text-dim);
        border: none;
        padding: 9px 10px;
        border-radius: calc(var(--radius-sm) - 2px);
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
      }
      .tab.active {
        background: var(--bg-card);
        color: var(--text);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }
      .mt {
        margin-top: 18px;
      }
      .mt-sm {
        margin-top: 14px;
      }
      .social {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 18px 0 14px;
      }
      .social-btn {
        justify-content: center;
      }
      .social-ico {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        background: #fff;
        color: #1a1406;
        font-size: 0.85rem;
      }
      .or {
        text-align: center;
        position: relative;
        margin: 6px 0 14px;
        color: var(--text-mute);
        font-size: 0.85rem;
      }
      .or::before,
      .or::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 42%;
        height: 1px;
        background: var(--border);
      }
      .or::before {
        left: 0;
      }
      .or::after {
        right: 0;
      }
      .role-toggle {
        display: flex;
        gap: 8px;
      }
      .role-toggle label {
        flex: 1;
        padding: 10px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        text-align: center;
        cursor: pointer;
        color: var(--text-dim);
        font-weight: 500;
      }
      .role-toggle label.active {
        border-color: var(--accent);
        color: var(--accent);
        background: var(--accent-soft);
      }
      .role-toggle input {
        display: none;
      }
      code {
        background: var(--bg-elev);
        padding: 1px 6px;
        border-radius: 4px;
      }
      .side {
        padding: 28px;
        position: sticky;
        top: 80px;
      }
      .perks {
        list-style: none;
        padding: 0;
        margin: 12px 0 0;
        display: grid;
        gap: 10px;
        color: var(--text-dim);
      }
    `,
  ],
})
export class AuthComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private n = inject(NotificationService);

  mode = signal<Mode>('login');
  role = signal<Role>('client');

  name = '';
  email = '';
  phone = '';
  password = '';

  setMode(m: Mode) {
    this.mode.set(m);
  }

  submit(event: Event) {
    event.preventDefault();
    try {
      if (this.mode() === 'login') {
        this.auth.login(this.email, this.password);
        this.n.success('Login realizado.');
      } else {
        this.auth.register({
          name: this.name,
          email: this.email,
          phone: this.phone,
          password: this.password,
          role: this.role(),
        });
        this.n.success('Conta criada com sucesso!');
      }
      this.routeAfterLogin();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar.';
      this.n.error(msg);
    }
  }

  social(provider: 'google' | 'apple') {
    this.n.info(
      'Login social ainda é simulado no MVP — veja o README para ativar com Firebase Auth.',
    );
    this.auth.mockSocialLogin(provider);
    this.routeAfterLogin();
  }

  private routeAfterLogin() {
    if (this.auth.isBarber()) this.router.navigate(['/barbeiro']);
    else this.router.navigate(['/minha-conta']);
  }
}
