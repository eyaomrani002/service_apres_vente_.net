export type Appointment = {
  id: string;
  technicianId: string;
  title?: string;
  notes?: string;
  startUtc: string;
  endUtc: string;
};

export type ScheduleRequest = {
  technicianId: string;
  title?: string;
  notes?: string;
  startUtc: string; // ISO
  endUtc: string;   // ISO
};
