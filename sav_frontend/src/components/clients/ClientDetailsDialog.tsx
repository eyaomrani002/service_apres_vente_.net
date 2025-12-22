import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider, List, ListItem, ListItemText, Box } from '@mui/material';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';

interface Props {
  open: boolean;
  client: Client | null;
  onClose: () => void;
}

const ClientDetailsDialog: React.FC<Props> = ({ open, client, onClose }) => {
  const [reclamations, setReclamations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!client) return;
      setLoading(true);
      try {
        const data = await clientService.getReclamationsForClient(client.id);
        setReclamations(Array.isArray(data) ? data : []);
      } catch {
        setReclamations([]);
      } finally { setLoading(false); }
    };
    run();
  }, [client, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Détails du client</DialogTitle>
      <DialogContent dividers>
        {client && (
          <Box>
            <Typography variant="h6" gutterBottom>{client.nom}</Typography>
            <Typography>Email: {client.email || '-'}</Typography>
            <Typography>Téléphone: {client.telephone || '-'}</Typography>
            <Typography>Adresse: {client.adresse || '-'}</Typography>
            <Typography>Date d'inscription: {client.dateInscription ? new Date(client.dateInscription).toLocaleDateString() : '-'}</Typography>
            <Typography sx={{ mt: 1 }}>Réclamations: {client.nombreReclamations ?? '-'}</Typography>
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>Réclamations du client</Typography>
        {loading ? (
          <Typography>Chargement...</Typography>
        ) : (
          <List>
            {reclamations.length === 0 && <Typography>Aucune réclamation</Typography>}
            {reclamations.map((r: any) => (
              <ListItem key={r.id} alignItems="flex-start">
                <ListItemText
                  primary={`${r.sujet || 'Réclamation'}${r.status ? ' • ' + r.status : ''}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.secondary">
                        {r.dateCreation ? new Date(r.dateCreation).toLocaleString() : ''}
                      </Typography>
                      {r.description && <Typography variant="body2">{r.description}</Typography>}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientDetailsDialog;
