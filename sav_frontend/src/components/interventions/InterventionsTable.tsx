import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { Intervention } from '../../types/intervention';

interface Props {
  items: Intervention[];
  onEdit: (r: Intervention) => void;
  onDelete: (id: number) => void;
}

const InterventionsTable: React.FC<Props> = ({ items, onEdit, onDelete }) => {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Réclamation</TableCell>
            <TableCell>Technicien</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Coût total</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(i => (
            <TableRow key={i.id} hover>
              <TableCell>{i.id}</TableCell>
              <TableCell>#{i.reclamationId}</TableCell>
              <TableCell>{i.technicienNom} (#{i.technicienId})</TableCell>
              <TableCell>{i.statut}</TableCell>
              <TableCell>{i.dateIntervention ? new Date(i.dateIntervention).toLocaleString() : ''}</TableCell>
              <TableCell align="right">{i.coutTotal ?? ''}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onEdit(i)} size="small"><Edit /></IconButton>
                <IconButton onClick={() => onDelete(i.id)} size="small" color="error"><Delete /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InterventionsTable;
