import { Routes } from '@angular/router';
import { authGuard, barberGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing').then((m) => m.LandingComponent),
    title: 'Tony Barbearia',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/auth').then((m) => m.AuthComponent),
    title: 'Entrar — Tony Barbearia',
  },
  {
    path: 'agendar',
    loadComponent: () =>
      import('./pages/booking/booking').then((m) => m.BookingComponent),
    title: 'Agendar — Tony Barbearia',
  },
  {
    path: 'minha-conta',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/client-dashboard/client-dashboard').then(
        (m) => m.ClientDashboardComponent,
      ),
    title: 'Meus cortes — Tony Barbearia',
  },
  {
    path: 'barbeiro',
    canActivate: [authGuard, barberGuard],
    loadComponent: () =>
      import('./pages/barber-dashboard/barber-dashboard').then(
        (m) => m.BarberDashboardComponent,
      ),
    title: 'Painel — Tony Barbearia',
  },
  { path: '**', redirectTo: '' },
];
