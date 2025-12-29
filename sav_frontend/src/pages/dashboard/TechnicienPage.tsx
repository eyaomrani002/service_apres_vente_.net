import React, { useContext, useEffect, useMemo, useState } from 'react';
import { 
  Box, CircularProgress, Snackbar, Alert, Button,
  Card, CardContent, Grid, Typography, Chip, Avatar,
  IconButton, Tooltip, Badge
} from '@mui/material';
import { 
  Add, Build, Phone, Email, LocationOn, 
  Edit, Delete, Visibility, CheckCircle, Cancel,
  Person, Work, Engineering
} from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import TechnicienForm from '../../components/technicien/TechnicienForm';
import TechnicienDetailsDialog from '../../components/technicien/TechnicienDetailsDialog';
import TechnicienFilters from '../../components/technicien/TechnicienFilters';
import { Technicien } from '../../types/technicien';
import technicienService from '../../services/technicienService';
import { getUsers } from '../../services/userService';
import AuthContext from '../../contexts/AuthContext';

const TechnicienPage: React.FC = () => {
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Technicien | null>(null);
  const [selected, setSelected] = useState<Technicien | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const { hasRole } = useContext(AuthContext);
  const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await technicienService.getAll();
      
      // Transformer les compétences CSV en tableau
      const processedData = data.map(tech => ({
        ...tech,
        competences: tech.competences 
          ? (typeof tech.competences === 'string' 
              ? tech.competences.split(',').map(c => c.trim()).filter(c => c)
              : tech.competences)
          : []
      }));
      
      setTechniciens(processedData);
    } catch (e: any) {
      setMessage(e.message || 'Erreur lors du chargement des techniciens');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // CRUD handlers
  const handleAdd = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const handleEdit = (tech: Technicien) => {
    setEditing(tech);
    setOpenForm(true);
  };

  const handleDelete = async (tech: Technicien) => {
    if (window.confirm(`Supprimer le technicien "${tech.nom}" ?`)) {
      try {
        await technicienService.delete(tech.id);
        setMessage('Technicien supprimé avec succès');
        setMessageType('success');
        load();
      } catch (e: any) {
        setMessage(e.message || 'Erreur lors de la suppression');
        setMessageType('error');
      }
    }
  };

  const handleFormSubmit = async (data: Partial<Technicien>) => {
    try {
      // Convertir tableau compétences en CSV pour le backend
      const payload = {
        ...data,
        competences: Array.isArray(data.competences) 
          ? data.competences.join(',')
          : data.competences
      };

      if (editing) {
        await technicienService.update(editing.id, payload);
        setMessage('Technicien modifié avec succès');
      } else {
        await technicienService.create(payload);
        setMessage('Technicien ajouté avec succès');
      }
      setMessageType('success');
      setOpenForm(false);
      load();
    } catch (e: any) {
      setMessage(e.message || 'Erreur lors de l\'enregistrement');
      setMessageType('error');
    }
  };

  const handleView = (tech: Technicien) => setSelected(tech);
  const handleCloseDetails = () => setSelected(null);

  // Filtering
  const filtered = techniciens.filter(t => {
    if (filters.nom && !t.nom?.toLowerCase().includes(filters.nom.toLowerCase())) return false;
    if (filters.zone && !t.zone?.toLowerCase().includes(filters.zone.toLowerCase())) return false;
    if (filters.disponibilite && t.disponibilite !== filters.disponibilite) return false;
    return true;
  });

  const handleFilterChange = (f: Record<string, string>) => setFilters(f);
  const handleFilterReset = () => setFilters({});

  // Statistiques
  const stats = {
    total: techniciens.length,
    disponibles: techniciens.filter(t => t.disponibilite === 'Disponible').length,
    actifs: techniciens.filter(t => t.isActif).length,
  };

  // Get status color
  const getStatusColor = (disponibilite?: string) => {
    switch(disponibilite) {
      case 'Disponible': return 'success';
      case 'Occupé': return 'warning';
      case 'Indisponible': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <PageTitle 
        title="Gestion des Techniciens" 
        icon={<Engineering sx={{ fontSize: 32 }} />} 
      />
      
      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Techniciens total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">{stats.disponibles}</Typography>
              <Typography variant="body2" color="text.secondary">Disponibles</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main">{stats.actifs}</Typography>
              <Typography variant="body2" color="text.secondary">Actifs</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* En-tête avec actions */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Typography variant="h6">
          {filtered.length} technicien{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={handleAdd}
            sx={{ ml: 1 }}
          >
            Ajouter un technicien
          </Button>
        </Box>
      </Box>

      {/* Filtres */}
      <TechnicienFilters 
        filters={filters} 
        onChange={handleFilterChange} 
        onReset={handleFilterReset} 
      />

      {/* Liste des techniciens */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((tech) => (
            <Grid item xs={12} sm={6} md={4} key={tech.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* En-tête carte */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: tech.isActif ? 'primary.main' : 'grey.400',
                        mr: 2,
                        width: 50,
                        height: 50
                      }}
                    >
                      {tech.nom ? tech.nom.charAt(0).toUpperCase() : 'T'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div">
                        {tech.nom}
                        {tech.isActif && (
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main', ml: 1 }} />
                        )}
                      </Typography>
                      <Chip 
                        label={tech.disponibilite || 'Non défini'} 
                        size="small"
                        color={getStatusColor(tech.disponibilite) as any}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  {/* Informations */}
                  <Box sx={{ mb: 2 }}>
                    {tech.email && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        {tech.email}
                      </Typography>
                    )}
                    {tech.telephone && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        {tech.telephone}
                      </Typography>
                    )}
                    {tech.zone && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        {tech.zone}
                      </Typography>
                    )}
                  </Box>

                  {/* Compétences */}
                  {tech.competences && tech.competences.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Compétences
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {tech.competences.slice(0, 3).map((c, i) => (
                          <Chip key={i} label={c} size="small" variant="outlined" />
                        ))}
                        {tech.competences.length > 3 && (
                          <Chip label={`+${tech.competences.length - 3}`} size="small" />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Actions */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider'
                  }}>
                    <Tooltip title="Voir détails">
                      <IconButton size="small" onClick={() => handleView(tech)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton size="small" onClick={() => handleEdit(tech)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton size="small" onClick={() => handleDelete(tech)} color="error">
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Aucun résultat */}
      {!loading && filtered.length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          p: 8,
          bgcolor: 'background.paper',
          borderRadius: 2
        }}>
          <Engineering sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Aucun technicien trouvé
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Essayez de modifier vos filtres ou ajoutez un nouveau technicien
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={handleAdd}
            sx={{ mt: 3 }}
          >
            Ajouter un technicien
          </Button>
        </Box>
      )}

      {/* Dialogs */}
      <TechnicienForm 
        open={openForm} 
        onClose={() => setOpenForm(false)} 
        onSubmit={handleFormSubmit} 
        initialData={editing || undefined} 
      />
      <TechnicienDetailsDialog 
        open={!!selected} 
        onClose={handleCloseDetails} 
        technicien={selected} 
      />

      {/* Notifications */}
      <Snackbar 
        open={!!message} 
        autoHideDuration={4000} 
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={messageType} 
          onClose={() => setMessage(null)}
          variant="filled"
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TechnicienPage;