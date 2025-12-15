import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { Article } from '../../types/article';

interface Props {
  articles: Article[];
  onEdit: (a: Article) => void;
  onDelete: (id: number) => void;
  onView?: (a: Article) => void;
}

const ArticlesTable: React.FC<Props> = ({ articles, onEdit, onDelete, onView }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Réf</TableCell>
            <TableCell>Nom</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Prix</TableCell>
            <TableCell>En stock</TableCell>
            <TableCell>Sous garantie</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {articles.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.reference}</TableCell>
              <TableCell>{a.nom}</TableCell>
              <TableCell>{a.type}</TableCell>
              <TableCell>{a.prixAchat?.toFixed(2)}</TableCell>
              <TableCell>{a.estEnStock ? 'Oui' : 'Non'}</TableCell>
              <TableCell>{a.estSousGarantie ? 'Oui' : 'Non'}</TableCell>
              <TableCell align="right">
                <Tooltip title="Voir">
                  <IconButton onClick={() => onView && onView(a)} size="small">
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Modifier">
                  <IconButton onClick={() => onEdit(a)} size="small">
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton onClick={() => onDelete(a.id)} size="small">
                    <Delete />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ArticlesTable;
