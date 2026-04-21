import { Injectable } from '@angular/core';
import {
  Appointment,
  BarberProfile,
  DayHours,
  Service,
  User,
} from '../models';
import { DataService, newId } from './data.service';

const MIN_CANCEL_HOURS = 2;

export interface TimeSlot {
  startAt: string; // ISO
  endAt: string; // ISO
  label: string; // "14:30"
  available: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private data: DataService) {}

  /** Gera slots de um dia com base nos horários de trabalho do barbeiro. */
  slotsForDay(dateISO: string, service: Service): TimeSlot[] {
    const barber = this.data.barber();
    const date = new Date(dateISO + 'T00:00:00');
    const weekday = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const day: DayHours = barber.workingHours[weekday];
    if (!day.open) return [];

    const slots: TimeSlot[] = [];
    const [openH, openM] = day.start.split(':').map(Number);
    const [closeH, closeM] = day.end.split(':').map(Number);

    const dayStart = new Date(date);
    dayStart.setHours(openH, openM, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(closeH, closeM, 0, 0);

    const slotMin = barber.slotMinutes;
    const now = new Date();

    const existing = this.data
      .appointments()
      .filter(
        (a) =>
          a.status !== 'cancelled' &&
          new Date(a.startAt).toDateString() === date.toDateString(),
      );

    for (
      let t = new Date(dayStart);
      // agendamento precisa terminar antes do fechamento
      t.getTime() + service.durationMin * 60000 <= dayEnd.getTime();
      t = new Date(t.getTime() + slotMin * 60000)
    ) {
      const start = new Date(t);
      const end = new Date(start.getTime() + service.durationMin * 60000);
      const overlaps = existing.some((a) => {
        const aStart = new Date(a.startAt).getTime();
        const aEnd = new Date(a.endAt).getTime();
        return start.getTime() < aEnd && end.getTime() > aStart;
      });
      const inPast = start.getTime() < now.getTime();
      slots.push({
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        label: start.toTimeString().slice(0, 5),
        available: !overlaps && !inPast,
      });
    }
    return slots;
  }

  /** Cria um agendamento validando conflitos. */
  book(params: {
    client: User;
    service: Service;
    startAtISO: string;
    notes?: string;
  }): Appointment {
    const { client, service, startAtISO, notes } = params;
    const start = new Date(startAtISO);
    const end = new Date(start.getTime() + service.durationMin * 60000);

    const conflict = this.data.appointments().some((a) => {
      if (a.status === 'cancelled') return false;
      const aStart = new Date(a.startAt).getTime();
      const aEnd = new Date(a.endAt).getTime();
      return start.getTime() < aEnd && end.getTime() > aStart;
    });
    if (conflict) throw new Error('Esse horário já foi agendado.');
    if (start.getTime() < Date.now())
      throw new Error('Não é possível agendar no passado.');

    const barber: BarberProfile = this.data.barber();
    const appt: Appointment = {
      id: 'ap-' + newId(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      barberId: barber.id,
      serviceId: service.id,
      serviceName: service.name,
      priceCents: service.priceCents,
      durationMin: service.durationMin,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      status: 'pending',
      notes,
      createdAt: new Date().toISOString(),
    };
    this.data.addAppointment(appt);
    return appt;
  }

  confirm(id: string) {
    this.data.updateAppointment(id, { status: 'confirmed' });
  }

  complete(id: string) {
    this.data.updateAppointment(id, { status: 'completed' });
  }

  /** Cliente só consegue cancelar se faltarem > MIN_CANCEL_HOURS. */
  canClientCancel(appt: Appointment): boolean {
    if (appt.status === 'cancelled' || appt.status === 'completed') return false;
    const diffMs = new Date(appt.startAt).getTime() - Date.now();
    return diffMs > MIN_CANCEL_HOURS * 60 * 60 * 1000;
  }

  hoursUntil(appt: Appointment): number {
    return (
      (new Date(appt.startAt).getTime() - Date.now()) / (60 * 60 * 1000)
    );
  }

  cancelAsClient(appt: Appointment): void {
    if (!this.canClientCancel(appt)) {
      throw new Error(
        `Cancelamentos só podem ser feitos com mais de ${MIN_CANCEL_HOURS} horas de antecedência. Entre em contato com o barbeiro.`,
      );
    }
    this.data.updateAppointment(appt.id, { status: 'cancelled' });
  }

  /** Barbeiro pode cancelar a qualquer momento. */
  cancelAsBarber(appt: Appointment): void {
    this.data.updateAppointment(appt.id, { status: 'cancelled' });
  }

  minCancelHours(): number {
    return MIN_CANCEL_HOURS;
  }
}
