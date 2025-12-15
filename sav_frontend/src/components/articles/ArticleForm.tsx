import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Article } from '../../types/article';

interface Props {
  open: boolean;
  article?: Article | null;
  onClose: () => void;
  onSave: (a: Partial<Article>) => void;
}

const ArticleForm: React.FC<Props> = ({ open, article, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Article>>({});

  useEffect(() => {
    setForm(article ? { ...article } : { reference: '', nom: '', type: '', prixAchat: 0, estEnStock: true, estSousGarantie: false });
  }, [article, open]);

  const handleChange = (k: keyof Article, v: any) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{article ? 'Modifier Article' : 'Nouvel Article'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField label="Référence" value={form.reference || ''} fullWidth onChange={(e) => handleChange('reference', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Nom" value={form.nom || ''} fullWidth onChange={(e) => handleChange('nom', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Type" value={form.type || ''} fullWidth onChange={(e) => handleChange('type', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Prix d'achat" type="number" value={form.prixAchat ?? 0} fullWidth onChange={(e) => handleChange('prixAchat', parseFloat(e.target.value || '0'))} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" value={form.description || ''} fullWidth multiline rows={3} onChange={(e) => handleChange('description', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel control={<Checkbox checked={!!form.estEnStock} onChange={(e) => handleChange('estEnStock', e.target.checked)} />} label="En Stock" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel control={<Checkbox checked={!!form.estSousGarantie} onChange={(e) => handleChange('estSousGarantie', e.target.checked)} />} label="Sous Garantie" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={() => onSave(form)} variant="contained">Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArticleForm;
