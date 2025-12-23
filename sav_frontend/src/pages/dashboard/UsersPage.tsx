import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { addRoleToUser, getUsers } from '../../services/userService';
import type { AppUser } from '../../types/user';

type RoleMessage = {
  severity: 'success' | 'error';
  text: string;
};

const USERS_FETCH_ERROR = 'Impossible de charger la liste d\'utilisateurs.';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [newRole, setNewRole] = useState('');
  const [roleMessage, setRoleMessage] = useState<RoleMessage | null>(null);
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  const getErrorMessage = useCallback((err: unknown, fallback: string) => {
    return err instanceof Error ? err.message : fallback;
  }, []);

  const loadUsers = useCallback(async (): Promise<AppUser[]> => {
    try {
      const payload = await getUsers();
      setUsers(payload);
      setError(null);
      return payload;
    } catch (err) {
      const message = getErrorMessage(err, USERS_FETCH_ERROR);
      setError(message);
      console.error(err);
      return [];
    }
  }, [getErrorMessage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddRole = async () => {
    if (!selectedUser) {
      setRoleMessage({ severity: 'error', text: 'Sélectionnez un utilisateur.' });
      return;
    }

    if (!newRole.trim()) {
      setRoleMessage({ severity: 'error', text: 'Indiquez le nom du rôle à ajouter.' });
      return;
    }

    setRoleMessage(null);
    setIsAssigningRole(true);
    const targetUser = selectedUser;

    try {
      const message = await addRoleToUser(targetUser.id, newRole.trim());
      setRoleMessage({
        severity: 'success',
        text: message || 'Rôle ajouté avec succès.',
      });
      setNewRole('');
      const refreshed = await loadUsers();
      const focusedUser = refreshed.find((item) => item.id === targetUser.id) ?? null;
      setSelectedUser(focusedUser);
    } catch (err) {
      const message = getErrorMessage(err, 'Impossible d\'ajouter ce rôle.');
      setRoleMessage({ severity: 'error', text: message });
      console.error(err);
    } finally {
      setIsAssigningRole(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Utilisateurs et rôles
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Liste des utilisateurs connectés et de leurs habilitations. Seul le backend peut confirmer les droits réels.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Ajouter un rôle à un utilisateur
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="flex-start"
          flexWrap="wrap"
        >
          <Autocomplete
            options={users}
            value={selectedUser}
            onChange={(_, value) => setSelectedUser(value)}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            getOptionLabel={(option) =>
              `${option.firstName} ${option.lastName} (${option.userName})`
            }
            sx={{ flex: 1, minWidth: 220 }}
            renderInput={(params) => (
              <TextField {...params} label="Utilisateur cible" placeholder="Choisir un utilisateur" />
            )}
          />
          <TextField
            label="Rôle"
            placeholder="Ex : Admin, Support"
            value={newRole}
            onChange={(event) => setNewRole(event.target.value)}
            sx={{ minWidth: 220, flex: 1 }}
            error={Boolean(
              selectedUser && newRole.trim() && selectedUser.roles.some((r) => r.toLowerCase() === newRole.trim().toLowerCase())
            )}
            helperText={
              selectedUser && newRole.trim() && selectedUser.roles.some((r) => r.toLowerCase() === newRole.trim().toLowerCase())
                ? 'Ce rôle est déjà attribué à cet utilisateur.'
                : null
            }
          />
          <Button
            variant="contained"
            onClick={handleAddRole}
            disabled={
              isAssigningRole ||
              !selectedUser ||
              !newRole.trim() ||
              (selectedUser && newRole.trim() &&
                selectedUser.roles.some((r) => r.toLowerCase() === newRole.trim().toLowerCase()))
            }
          >
            {isAssigningRole ? 'Ajout en cours…' : 'Ajouter le rôle'}
          </Button>
        </Stack>
        {roleMessage && (
          <Alert severity={roleMessage.severity} sx={{ mt: 2 }}>
            {roleMessage.text}
          </Alert>
        )}
      </Paper>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Total d'utilisateurs récupérés : {users.length} (données live)
      </Typography>

      <TableContainer component={Paper} elevation={2} sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => {
              const primaryRole = user.roles?.[0] ?? '—';
              const active = user.isActive;
              return (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Stack>
                      <Typography fontWeight={600}>
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {user.userName}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        ID {user.id}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Chip key={`${user.id}-${role}`} label={role} color="primary" size="small" />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Aucun rôle
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={active ? 'Actif' : 'Inactif'}
                      color={active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UsersPage;