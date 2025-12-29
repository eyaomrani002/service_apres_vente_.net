import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Avatar } from '@mui/material';
import { Technicien } from '../../types/technicien';

interface TechnicienDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  technicien: Technicien | null;
}

const TechnicienDetailsDialog: React.FC<TechnicienDetailsDialogProps> = ({ open, onClose, technicien }) => {
  if (!technicien) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Détail du technicien</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2 }}>{technicien.nom ? technicien.nom.charAt(0).toUpperCase() : '?'}</Avatar>
          <Box>
            <Typography variant="h6">{technicien.nom}</Typography>
            <Typography variant="body2" color="text.secondary">{technicien.email}</Typography>
            <Typography variant="body2" color="text.secondary">{technicien.telephone}</Typography>
          </Box>
        </Box>
        <Typography variant="body2">Zone: {technicien.zone || 'N/A'}</Typography>
        <Typography variant="body2">Compétences: {technicien.competences?.join(', ') || 'N/A'}</Typography>
        <Typography variant="body2">Actif: {technicien.isActif ? 'Oui' : 'Non'}</Typography>
        <Typography variant="body2">Disponibilité: {technicien.disponibilite || 'N/A'}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TechnicienDetailsDialog;
