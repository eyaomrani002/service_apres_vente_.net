import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Chip } from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { Reclamation } from '../../types/reclamation';

interface Props {
  items: Reclamation[];
  onEdit: (r: Reclamation) => void;
  onDelete: (id: number) => void;
  onView?: (r: Reclamation) => void;
}

const ReclamationsTable: React.FC<Props> = ({ items, onEdit, onDelete, onView }) => {
  const colorForStatus = (s?: string) => s === 'resolue' ? 'success' : s === 'en_cours' ? 'warning' : 'default';

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Sujet</TableCell>
            <TableCell>Priorité</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.id}</TableCell>
              <TableCell>{r.clientId ?? '-'}</TableCell>
              <TableCell>{r.sujet ?? '-'}</TableCell>
              <TableCell>{r.priorite ?? '-'}</TableCell>
              <TableCell><Chip size="small" label={r.statut ?? '-'} color={colorForStatus(r.statut) as any} /></TableCell>
              <TableCell>{r.dateCreation ? new Date(r.dateCreation).toLocaleString() : '-'}</TableCell>
              <TableCell align="right">
                <Tooltip title="Voir"><IconButton size="small" onClick={() => onView && onView(r)}><Visibility /></IconButton></Tooltip>
                <Tooltip title="Modifier"><IconButton size="small" onClick={() => onEdit(r)}><Edit /></IconButton></Tooltip>
                <Tooltip title="Supprimer"><IconButton size="small" onClick={() => onDelete(r.id)}><Delete /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ReclamationsTable;
