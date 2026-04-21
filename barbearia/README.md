# Tony Barbearia — Site de agendamentos

Site completo de barbearia (MVP) feito em **Angular 21 (standalone + signals)**
com perfil público, agendamento online, área do cliente e painel do barbeiro.

- Stack: Angular 21, TypeScript, SCSS (sem Angular Material — tema próprio).
- Persistência: camada abstraída em `StorageService` (hoje `localStorage`,
  pronta para trocar por Firebase / Supabase / API REST).
- Autenticação: `AuthService` com e-mail/senha + botões Google/Apple (stub
  pronto para Firebase Auth).
- Responsivo: desktop, tablet e mobile.

![Angular 21](https://img.shields.io/badge/Angular-21-dd0031?logo=angular)
![Node 20+](https://img.shields.io/badge/Node-%3E=20-43853d?logo=nodedotjs)

---

## 🚀 Como rodar localmente

```bash
# dentro de barbearia/
npm install
npm start
# abre em http://localhost:4200
```

Para gerar o build de produção:

```bash
npm run build        # gera dist/barbearia/
```

### Contas de demonstração (seed automático)

| Papel    | E-mail                 | Senha    |
|----------|------------------------|----------|
| Cliente  | cliente@demo.com       | demo123  |
| Barbeiro | tony@barbearia.com     | tony123  |

> Também dá para criar conta nova em `/login` (aba “Criar conta”).

---

## 🧭 Rotas

| Rota           | Quem acessa  | O que faz                                          |
|----------------|--------------|----------------------------------------------------|
| `/`            | público      | Landing — perfil, sobre, galeria, serviços, horários |
| `/agendar`     | público      | Fluxo de agendamento (serviço → data → horário)    |
| `/login`       | público      | Login / cadastro / login social (mock)             |
| `/minha-conta` | cliente      | Agendamentos futuros, lembretes e histórico        |
| `/barbeiro`    | barbeiro     | Painel com agenda, clientes e edição de perfil     |

---

## 🗂️ Estrutura

```
src/app/
  models/                 Interfaces TypeScript (User, Appointment, etc.)
  services/
    storage.service.ts    Wrapper localStorage (substituir por Firestore)
    data.service.ts       CRUD + seed de dados iniciais
    auth.service.ts       Login / cadastro / sessão (stub social)
    appointment.service.ts Slots, regras de 2h para cancelamento, confirmação
    notification.service.ts Toasts
  guards/auth.guard.ts    authGuard / barberGuard
  components/
    navbar/               Cabeçalho global
    toast/                Notificações in-app
  pages/
    landing/              Home (sobre + galeria + serviços + horários)
    auth/                 Login + cadastro (tabs)
    booking/              Fluxo de agendamento em 4 passos
    client-dashboard/     Minha conta
    barber-dashboard/     Painel com tabs Agenda / Clientes / Perfil
```

---

## 💡 Decisões de arquitetura

### Por que Angular standalone?
- Sem NgModules: components declaram suas próprias dependências (`imports: []`).
- Lazy-loading por rota com `loadComponent()`.
- Signals (`signal`, `computed`) como reatividade principal — menos ceremônia
  que RxJS para estado local, bem integrado com o novo change detection
  “zoneless”.

### Camada de dados
Tudo entra/sai por `DataService`. Hoje os métodos leem/gravam em
`localStorage` via `StorageService`. Para trocar por Firebase:

1. Instale `@angular/fire firebase`.
2. Reimplemente `DataService` chamando Firestore (`addDoc`, `onSnapshot`…).
3. Não precisa tocar em telas, serviços ou guards.

### Regra dos 2 horas
`AppointmentService.canClientCancel(appt)` calcula a diferença em horas.
Quando menor que `MIN_CANCEL_HOURS` (= 2), o botão some no dashboard do
cliente e a API (`cancelAsClient`) lança erro. No backend real, a mesma regra
deve rodar em Cloud Function / endpoint protegido para impedir by-pass.

### Slots disponíveis
`AppointmentService.slotsForDay` gera horários a partir de:
- `workingHours[weekday]` do barbeiro,
- `slotMinutes` (granularidade),
- `service.durationMin`,
- conflitos com agendamentos existentes (exceto cancelados),
- e ignora horários no passado.

---

## 🔌 Próximos passos para produção

### 1. Banco de dados real (Firestore recomendado)

```bash
npm i @angular/fire firebase
```

`app.config.ts`:

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

providers: [
  provideFirebaseApp(() => initializeApp(environment.firebase)),
  provideFirestore(() => getFirestore()),
  // ...
]
```

Mapear coleções:

- `users/{uid}`  — `User`
- `barbers/{id}` — `BarberProfile`
- `appointments/{id}` — `Appointment`

Reescrever `DataService` substituindo `storage.set/get` por
`setDoc`/`getDoc`/`collectionSnapshots`.

### 2. Login Google / Apple

```bash
npm i @angular/fire
```

```ts
import {
  Auth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';

const auth = inject(Auth);
await signInWithPopup(auth, new GoogleAuthProvider());
await signInWithPopup(auth, new OAuthProvider('apple.com'));
```

No console Firebase: **Authentication → Sign-in method** habilite
Google e Apple. Para Apple, é necessária uma conta Apple Developer
(US$ 99/ano) para criar o Service ID.

> Você só vai receber o que pedir no `scope` — default: `uid`, `email`,
> `displayName`, `photoURL`. Nunca vê senha.

### 3. Notificações (cliente + barbeiro)

**Estratégia recomendada (ordem de facilidade):**

| Canal                | Tech                                              |
|----------------------|---------------------------------------------------|
| E-mail (trigger + lembrete) | Firebase Extension **Trigger Email** (SendGrid/Mailchimp) |
| Push web no navegador | Firebase Cloud Messaging (FCM)                   |
| WhatsApp             | Twilio WhatsApp Business API                      |
| SMS                  | Twilio SMS                                        |

**Agendador de lembretes (enviar 24h e 2h antes):**
Usar **Cloud Scheduler + Cloud Functions** (ou Supabase cron):

```ts
// functions/src/reminders.ts (pseudo)
export const sendReminders = onSchedule('every 15 minutes', async () => {
  const now = Date.now();
  const start = now + 2 * 60 * 60 * 1000;  // 2h
  const end   = start + 15 * 60 * 1000;
  const snap = await db.collection('appointments')
    .where('startAt', '>=', new Date(start))
    .where('startAt', '<=', new Date(end))
    .where('reminderSent', '==', false)
    .get();
  await Promise.all(snap.docs.map(sendReminder));
});
```

O barbeiro recebe notificação em tempo real com FCM sempre que um agendamento
chegar (ouvir mudanças de `appointments`).

### 4. Regras de segurança (Firestore)

Exemplo resumido:

```
match /appointments/{id} {
  allow read: if request.auth.uid == resource.data.clientId
              || isBarber(request.auth.uid);
  allow create: if request.auth.uid == request.resource.data.clientId;
  allow update: if isBarber(request.auth.uid)
              || (request.auth.uid == resource.data.clientId
                  && resource.data.startAt.toMillis() - request.time.toMillis() > 2*60*60*1000);
}
```

Assim a regra dos 2h fica **garantida no servidor** — o frontend é só
conveniência.

### 5. Deploy

- Frontend: **Firebase Hosting**, **Vercel** ou **Netlify** (basta apontar
  para `dist/barbearia/browser`).
- Backend/notificações: **Firebase Functions** (escala a zero, cobra só quando
  roda).

---

## 🎨 Personalização do visual

Tudo é controlado por **variáveis CSS** em `src/styles.scss`:

```scss
:root {
  --accent: #d9a441;    /* dourado principal */
  --bg: #0e0d0b;        /* fundo */
  --text: #f3ece1;      /* texto */
  ...
}
```

Trocar a paleta inteira é questão de ajustar esses tokens.

Fotos da galeria e de capa vêm de URLs no `BarberProfile` — o barbeiro pode
editar pelo próprio painel (`/barbeiro` → aba “Meu perfil”).

---

## 🧪 O que já está implementado

- [x] Landing completa (hero, sobre, horários, serviços, galeria, CTA).
- [x] Cadastro + login e-mail/senha com role (cliente/barbeiro).
- [x] Botões Google/Apple (mock — 1 linha pra trocar por Firebase).
- [x] Fluxo de agendamento em 4 passos com slots reais por horário de trabalho.
- [x] Validação: sem conflito, sem horário no passado, respeita dias fechados.
- [x] Dashboard do cliente com lembretes (24h antes) e cancelamento +2h.
- [x] Painel do barbeiro: KPIs, agenda agrupada por dia, confirmar /
      marcar realizado / cancelar, lista de clientes com serviço favorito,
      edição completa do perfil (bio, horários, serviços, galeria).
- [x] Tema dark com fontes Google (Inter + Playfair Display).
- [x] Responsivo: mobile / tablet / desktop.
- [x] Toasts para feedback de ações.

## 🗺️ Roadmap sugerido

- [ ] Plugar Firebase (Auth + Firestore + Functions).
- [ ] Upload de foto da galeria (Firebase Storage) em vez de URL.
- [ ] Lembretes reais por e-mail / WhatsApp.
- [ ] Histórico financeiro e relatório mensal para o barbeiro.
- [ ] Múltiplos barbeiros na mesma barbearia.
- [ ] Avaliações de clientes.
- [ ] PWA (funciona offline + instalável).
