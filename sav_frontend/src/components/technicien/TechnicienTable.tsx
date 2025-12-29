import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { Technicien } from '../../types/technicien';

interface TechnicienTableProps {
  techniciens: Technicien[];
  onEdit: (technicien: Technicien) => void;
  onDelete: (technicien: Technicien) => void;
  onView: (technicien: Technicien) => void;
}

const TechnicienTable: React.FC<TechnicienTableProps> = ({ techniciens, onEdit, onDelete, onView }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nom</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Téléphone</TableCell>
            <TableCell>Zone</TableCell>
            <TableCell>Compétences</TableCell>
            <TableCell>Actif</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {techniciens.map((tech) => (
            <TableRow key={tech.id}>
              <TableCell>{tech.nom}</TableCell>
              <TableCell>{tech.email}</TableCell>
              <TableCell>{tech.telephone}</TableCell>
              <TableCell>{tech.zone}</TableCell>
              <TableCell>
                {(tech.competences || []).map((c, i) => (
                  <Chip key={i} label={c} size="small" sx={{ mr: 0.5 }} />
                ))}
              </TableCell>
              <TableCell>{tech.isActif ? 'Oui' : 'Non'}</TableCell>
              <TableCell>
                <IconButton onClick={() => onView(tech)}><Visibility /></IconButton>
                <IconButton onClick={() => onEdit(tech)}><Edit /></IconButton>
                <IconButton onClick={() => onDelete(tech)} color="error"><Delete /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TechnicienTable;
