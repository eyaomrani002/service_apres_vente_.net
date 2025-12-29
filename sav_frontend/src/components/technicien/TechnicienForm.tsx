import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Chip, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { Technicien } from '../../types/technicien';

interface TechnicienFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Technicien>) => void;
  initialData?: Partial<Technicien>;
}

const TechnicienForm: React.FC<TechnicienFormProps> = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState<Partial<Technicien>>(initialData || {});
  const [competenceInput, setCompetenceInput] = useState('');

  // Synchronize form state with initialData when editing
  useEffect(() => {
    setForm(initialData || {});
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setForm(prevForm => ({ ...prevForm, [name!]: value }));
  };

  const handleCompetenceAdd = () => {
    if (competenceInput.trim()) {
      setForm({ ...form, competences: [...(form.competences || []), competenceInput.trim()] });
      setCompetenceInput('');
    }
  };

  const handleCompetenceDelete = (index: number) => {
    setForm({ ...form, competences: (form.competences || []).filter((_, i) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{form.id ? 'Modifier' : 'Ajouter'} un technicien</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            margin="normal"
            label="Nom"
            name="nom"
            value={form.nom || ''}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="normal"
            label="Email"
            name="email"
            value={form.email || ''}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="normal"
            label="Téléphone"
            name="telephone"
            value={form.telephone || ''}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Zone"
            name="zone"
            value={form.zone || ''}
            onChange={handleChange}
            fullWidth
          />
          <FormControl margin="normal" fullWidth>
            <InputLabel id="disponibilite-label">Disponibilité</InputLabel>
            <Select
              labelId="disponibilite-label"
              label="Disponibilité"
              name="disponibilite"
              value={form.disponibilite || ''}
              onChange={handleChange}
            >
              <MenuItem value="">Non défini</MenuItem>
              <MenuItem value="Disponible">Disponible</MenuItem>
              <MenuItem value="Occupé">Occupé</MenuItem>
              <MenuItem value="Indisponible">Indisponible</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Ajouter une compétence"
              value={competenceInput}
              onChange={e => setCompetenceInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCompetenceAdd(); } }}
              fullWidth
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(form.competences || []).map((c, i) => (
                <Chip key={i} label={c} onDelete={() => handleCompetenceDelete(i)} />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained">{form.id ? 'Enregistrer' : 'Ajouter'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TechnicienForm;