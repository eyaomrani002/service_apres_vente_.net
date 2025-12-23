import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import DeleteIcon from '@mui/icons-material/Delete';
import calendarService from '../../services/calendarService';
import { Appointment, ScheduleRequest } from '../../types/calendar';

const CalendarPage: React.FC = () => {
  const [date, setDate] = useState<Date | null>(new Date());
  const [technicianId, setTechnicianId] = useState<string>(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) {
        const parsed = JSON.parse(u);
        return parsed?.id || '';
      }
    } catch {}
    return '';
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!technicianId || !date) return;
    fetchAppointments();
  }, [technicianId, date]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const isoDate = new Date(date!.toISOString()).toISOString();
      const res = await calendarService.getAppointments(technicianId, isoDate);
      setAppointments(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to fetch appointments', e);
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!technicianId || !date) return;
    try {
      const d = date!;
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const start = new Date(d);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(d);
      end.setHours(eh, em, 0, 0);
      const payload: ScheduleRequest = {
        technicianId,
        title,
        notes,
        startUtc: start.toISOString(),
        endUtc: end.toISOString(),
      };
      const created = await calendarService.create(payload);
      setAppointments((p) => [created, ...p]);
      setTitle(''); setNotes('');
    } catch (e: any) {
      console.error('Failed to create appointment', e);
      alert(e?.message || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    try {
      await calendarService.delete(id);
      setAppointments((p) => p.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Calendrier</Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date"
            value={date}
            onChange={(v) => setDate(v)}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>

        <TextField label="TechnicianId" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} />

        <Button variant="contained" onClick={fetchAppointments} disabled={loading}>Charger</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <TextField label="Début (HH:MM)" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <TextField label="Fin (HH:MM)" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        <Button variant="contained" color="primary" onClick={handleCreate}>Programmer</Button>
      </Box>

      <Typography variant="h6">Rendez-vous</Typography>
      <List>
        {appointments.map(appt => (
          <ListItem key={appt.id} secondaryAction={(
            <IconButton edge="end" onClick={() => handleDelete(appt.id)}>
              <DeleteIcon />
            </IconButton>
          )}>
            <ListItemText primary={appt.title || 'Sans titre'} secondary={`${new Date(appt.startUtc).toLocaleTimeString()} — ${new Date(appt.endUtc).toLocaleTimeString()} ${appt.notes ? '· ' + appt.notes : ''}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default CalendarPage;
