import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Tab,
  Tabs,
  Card,
  CardContent,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit,
  Save,
  CameraAlt,
  Lock,
  Notifications,
  Person,
  Email,
  Phone,
  LocationOn,
  Settings,
} from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+33 6 12 34 56 78',
    address: '123 Rue de la République',
    city: 'Paris',
    postalCode: '75001',
    jobTitle: 'Responsable SAV',
    department: 'Service Après-Vente',
    hireDate: '15/03/2020',
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    twoFactorAuth: true,
    marketingEmails: false,
    darkMode: false,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    void event; // Mark event as used to avoid unused variable TS6133 when not needed
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData({
      ...profileData,
      [field]: event.target.value,
    });
  };

  const handleSettingToggle = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      [field]: event.target.checked,
    });
  };

  const handleSave = () => {
    // Ici, vous ajouterez la logique pour sauvegarder les données
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  useEffect(() => {
    // Try to load logged-in user from localStorage and populate the form
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        const name = (u.name || '').trim();
        const [firstName, ...rest] = name ? name.split(' ') : [];
        const lastName = rest.join(' ');
        setProfileData(prev => ({
          ...prev,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          email: u.email || prev.email,
          // optionally map other known fields if your user object contains them
        }));
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  return (
    <Box>
      <PageTitle
        title="Mon profil"
        subtitle="Gérez vos informations personnelles et paramètres"
      />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' } }}>
        {/* Sidebar */}
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: 48,
                    bgcolor: 'primary.main',
                    mb: 2,
                  }}
                >
                  JD
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    right: 0,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'background.paper' },
                  }}
                >
                  <CameraAlt />
                </IconButton>
              </Box>

              <Typography variant="h5" gutterBottom>
                {profileData.firstName} {profileData.lastName}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profileData.jobTitle}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Membre depuis {profileData.hireDate}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2">{profileData.email}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2">{profileData.phone}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {profileData.address}, {profileData.city} {profileData.postalCode}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Main Content */}
        <Box>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Informations" icon={<Person />} iconPosition="start" />
                <Tab label="Sécurité" icon={<Lock />} iconPosition="start" />
                <Tab label="Notifications" icon={<Notifications />} iconPosition="start" />
                <Tab label="Préférences" icon={<Settings />} iconPosition="start" />
              </Tabs>
            </Box>

            {/* Informations Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Informations personnelles</Typography>
                <Button
                  variant={isEditing ? "contained" : "outlined"}
                  startIcon={isEditing ? <Save /> : <Edit />}
                  onClick={isEditing ? handleSave : handleEditToggle}
                >
                  {isEditing ? 'Enregistrer' : 'Modifier'}
                </Button>
              </Box>

              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={profileData.firstName}
                    onChange={handleInputChange('firstName')}
                    disabled={!isEditing}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={profileData.lastName}
                    onChange={handleInputChange('lastName')}
                    disabled={!isEditing}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={handleInputChange('email')}
                    disabled={!isEditing}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={profileData.phone}
                    onChange={handleInputChange('phone')}
                    disabled={!isEditing}
                  />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Adresse"
                    value={profileData.address}
                    onChange={handleInputChange('address')}
                    disabled={!isEditing}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Ville"
                    value={profileData.city}
                    onChange={handleInputChange('city')}
                    disabled={!isEditing}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Code postal"
                    value={profileData.postalCode}
                    onChange={handleInputChange('postalCode')}
                    disabled={!isEditing}
                  />
                </Box>
              </Box>
            </TabPanel>
            
            {/* Sécurité Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Sécurité du compte
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorAuth}
                      onChange={handleSettingToggle('twoFactorAuth')}
                    />
                  }
                  label="Authentification à deux facteurs"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Ajoutez une couche de sécurité supplémentaire à votre compte
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Changer le mot de passe
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Mot de passe actuel"
                      disabled
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      type="password"
                      label="Nouveau mot de passe"
                      disabled
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirmer le nouveau mot de passe"
                      disabled
                    />
                  </Box>
                </Box>
                <Button variant="contained" sx={{ mt: 2 }} disabled>
                  Changer le mot de passe
                </Button>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom color="error">
                  Zone de danger
                </Typography>
                <Button variant="outlined" color="error">
                  Supprimer mon compte
                </Button>
              </Box>
            </TabPanel>
            
            {/* Notifications Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Préférences de notification
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleSettingToggle('emailNotifications')}
                    />
                  }
                  label="Notifications par email"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Recevez des emails pour les nouvelles réclamations et interventions
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={handleSettingToggle('pushNotifications')}
                    />
                  }
                  label="Notifications push"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Recevez des notifications en temps réel dans votre navigateur
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.marketingEmails}
                      onChange={handleSettingToggle('marketingEmails')}
                    />
                  }
                  label="Emails marketing"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Recevez nos newsletters et offres spéciales
                </Typography>
              </Box>
            </TabPanel>
            
            {/* Préférences Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Préférences générales
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={handleSettingToggle('darkMode')}
                    />
                  }
                  label="Mode sombre"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Activez le thème sombre pour une meilleure expérience nocturne
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Langue
                </Typography>
                <Button variant="outlined" disabled>
                  Français
                </Button>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Fuseau horaire
                </Typography>
                <Button variant="outlined" disabled>
                  Europe/Paris (UTC+1)
                </Button>
              </Box>
            </TabPanel>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;