import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { ToastComponent } from './components/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar />
    <main class="app-main">
      <router-outlet />
    </main>
    <footer class="app-footer">
      <div class="container spread">
        <span class="mute small">
          © {{ year }} Tony Barbearia. Feito com Angular.
        </span>
        <span class="mute small">
          Santo André, SP — contato&#64;tonybarbearia.com
        </span>
      </div>
    </footer>
    <app-toast />
  `,
  styles: [
    `
      .app-main {
        min-height: calc(100vh - 140px);
      }
      .app-footer {
        border-top: 1px solid var(--border);
        padding: 22px 0;
        margin-top: 60px;
      }
    `,
  ],
})
export class App {
  year = new Date().getFullYear();
}
