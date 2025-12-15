import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip } from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { Client } from '../../types/client';

interface Props {
  clients: Client[];
  onEdit: (c: Client) => void;
  onDelete: (id: number) => void;
  onView?: (c: Client) => void;
}

const ClientsTable: React.FC<Props> = ({ clients, onEdit, onDelete, onView }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nom</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Téléphone</TableCell>
            <TableCell>Adresse</TableCell>
            <TableCell>Inscription</TableCell>
            <TableCell>Réclamations</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clients.map(c => (
            <TableRow key={c.id}>
              <TableCell>{c.nom}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>{c.telephone}</TableCell>
              <TableCell>{c.adresse}</TableCell>
              <TableCell>{c.dateInscription ? new Date(c.dateInscription).toLocaleDateString() : ''}</TableCell>
              <TableCell>{c.nombreReclamations ?? '-'}</TableCell>
              <TableCell align="right">
                <Tooltip title="Voir"><IconButton size="small" onClick={() => onView && onView(c)}><Visibility /></IconButton></Tooltip>
                <Tooltip title="Modifier"><IconButton size="small" onClick={() => onEdit(c)}><Edit /></IconButton></Tooltip>
                <Tooltip title="Supprimer"><IconButton size="small" onClick={() => onDelete(c.id)}><Delete /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ClientsTable;
