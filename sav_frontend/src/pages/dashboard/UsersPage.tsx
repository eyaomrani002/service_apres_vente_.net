import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { addRoleToUser, getUsers, removeRoleFromUser } from '../../services/userService';
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
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [roleMessage, setRoleMessage] = useState<RoleMessage | null>(null);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [removingRoleKey, setRemovingRoleKey] = useState<string | null>(null);

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

  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.roles?.forEach((r) => set.add(r)));
    return Array.from(set).sort();
  }, [users]);

  const handleAddRole = async () => {
    if (!selectedUser) {
      setRoleMessage({ severity: 'error', text: 'Sélectionnez un utilisateur.' });
      return;
    }

    if (newRoles.length === 0) {
      setRoleMessage({ severity: 'error', text: 'Choisissez au moins un rôle à ajouter.' });
      return;
    }

    setRoleMessage(null);
    setIsAssigningRole(true);
    const targetUser = selectedUser;

    try {
      const rolesToAdd = newRoles.filter(
        (r) => !targetUser.roles.some((existing) => existing.toLowerCase() === r.toLowerCase())
      );

      if (rolesToAdd.length === 0) {
        setRoleMessage({ severity: 'error', text: 'Tous ces rôles sont déjà attribués.' });
        setIsAssigningRole(false);
        return;
      }

      const results = [] as string[];
      for (const role of rolesToAdd) {
        const message = await addRoleToUser(targetUser.id, role);
        if (message) results.push(message);
      }

      setRoleMessage({
        severity: 'success',
        text: results.join(' ') || 'Rôles ajoutés avec succès.',
      });
      setNewRoles([]);
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

  const handleRemoveRole = async (user: AppUser, role: string) => {
    setRoleMessage(null);
    const key = `${user.id}-${role}`;
    setRemovingRoleKey(key);
    try {
      const message = await removeRoleFromUser(user.id, role);
      setRoleMessage({ severity: 'success', text: message || 'Rôle supprimé avec succès.' });
      const refreshed = await loadUsers();
      const focusedUser = refreshed.find((item) => item.id === user.id) ?? null;
      setSelectedUser(focusedUser);
    } catch (err) {
      const message = getErrorMessage(err, 'Impossible de supprimer ce rôle.');
      setRoleMessage({ severity: 'error', text: message });
      console.error(err);
    } finally {
      setRemovingRoleKey(null);
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
          <Autocomplete
            multiple
            options={availableRoles}
            value={newRoles}
            onChange={(_, value) => setNewRoles(value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Rôles"
                placeholder={availableRoles.length ? 'Sélectionner' : 'Aucun rôle connu'}
              />
            )}
            sx={{ minWidth: 220, flex: 1 }}
            disableCloseOnSelect
            clearOnBlur={false}
          />
          <Button
            variant="contained"
            onClick={handleAddRole}
            disabled={
              isAssigningRole ||
              !selectedUser ||
              newRoles.length === 0
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
                          <Chip
                            key={`${user.id}-${role}`}
                            label={role}
                            color="primary"
                            size="small"
                            onDelete={() => handleRemoveRole(user, role)}
                            disabled={removingRoleKey === `${user.id}-${role}`}
                          />
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