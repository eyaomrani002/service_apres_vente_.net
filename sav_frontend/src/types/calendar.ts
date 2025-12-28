export type Appointment = {
  id: string;
  technicianId: string;
  clientId?: string | null;
  ticketId?: string | null;
  reclamationId?: string | null;
  title?: string;
  notes?: string;
  status?: string;
  startUtc: string;
  endUtc: string;
};

export type ScheduleRequest = {
  technicianId: string;
  clientId?: string | null;
  ticketId?: string | null;
  reclamationId?: string | null;
  title: string; // Required by backend model
  notes?: string | null;
  status?: string;
  startUtc: string; // ISO
  endUtc: string;   // ISO
};
