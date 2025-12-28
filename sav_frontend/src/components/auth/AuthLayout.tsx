import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { styled, keyframes } from '@mui/material/styles';

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const float = keyframes`
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(8px, -8px); }
`;

// Styled components
const AnimatedBackground = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  zIndex: 0,
}));

const FloatingOrb = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: '50%',
  mixBlendMode: 'screen',
  filter: 'blur(60px)',
  animation: `${pulse} 4s ease-in-out infinite`,
}));

const GlowingBorder = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '2px',
  background: 'linear-gradient(90deg, #2196F3, #00BCD4, #2196F3)',
  animation: `${pulse} 2s ease-in-out infinite`,
}));

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const FloatingIcon = styled(Box)(({ theme }) => ({
  position: 'absolute',
  opacity: 0.3,
  animation: `${bounce} 3s ease-in-out infinite`,
}));

const AuthLayout: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.15), transparent 35%), radial-gradient(circle at 80% 0%, rgba(16,185,129,0.12), transparent 28%), linear-gradient(135deg, #0b1021 0%, #0e1a36 45%, #0b1021 100%)',
        py: 6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background */}
      <AnimatedBackground>
        <FloatingOrb
          sx={{
            width: '400px',
            height: '400px',
            backgroundColor: '#2196F3',
            top: `${mousePosition.y / 18}px`,
            left: `${mousePosition.x / 18}px`,
            opacity: 0.18,
            transition: 'all 0.3s ease-out',
          }}
        />
        <FloatingOrb
          sx={{
            width: '350px',
            height: '350px',
            backgroundColor: '#00BCD4',
            top: '28%',
            right: '22%',
            opacity: 0.14,
            animationDelay: '0.5s',
          }}
        />
        <FloatingOrb
          sx={{
            width: '300px',
            height: '300px',
            backgroundColor: '#03A9F4',
            bottom: '33%',
            left: '33%',
            opacity: 0.18,
            animationDelay: '1.2s',
          }}
        />
        <FloatingIcon
          sx={{
            top: '18%',
            left: '12%',
            fontSize: '24px',
            animationDuration: '6s',
          }}
        >
          ✨
        </FloatingIcon>
        <FloatingIcon
          sx={{
            bottom: '26%',
            right: '16%',
            fontSize: '26px',
            animationDuration: '7s',
            animationDelay: '1s',
          }}
        >
          ⚡
        </FloatingIcon>
      </AnimatedBackground>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.5s ease',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: '0 20px 60px rgba(33, 150, 243, 0.3)',
            },
          }}
        >
          {/* Bordure lumineuse supérieure */}
          <GlowingBorder />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'stretch',
              minHeight: { md: '600px' },
            }}
          >
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50%',
                background: 'linear-gradient(160deg, rgba(33,150,243,0.08) 0%, rgba(14,165,233,0.05) 60%, rgba(16,185,129,0.08) 100%)',
                p: 6,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(14,165,233,0.4) 0%, transparent 70%)',
                  animation: `${float} 6s ease-in-out infinite`,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />

              <Box sx={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
                {/* Icône centrale animée */}
                <Box
                  sx={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 32px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    boxShadow: '0 10px 40px rgba(33, 150, 243, 0.5)',
                    animation: `${pulse} 3s ease-in-out infinite`,
                  }}
                >
                  🛠️
                </Box>

                <Box
                  component="img"
                  src="/src/assets/images/auth-illustration.svg"
                  alt="illustration"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    filter: 'drop-shadow(0 10px 30px rgba(33, 150, 243, 0.3))',
                  }}
                />

                <Typography
                  variant="h5"
                  sx={{
                    mt: 4,
                      background: 'linear-gradient(135deg, #38bdf8 0%, #22d3ee 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Bienvenue chez Service SAV
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                      color: 'rgba(255, 255, 255, 0.78)',
                    mt: 2,
                    textAlign: 'center',
                    lineHeight: 1.6,
                  }}
                >
                  Gérez vos réclamations et interventions rapidement et simplement.
                </Typography>
              </Box>
            </Box>

            {/* Right: Form area */}
            <Box
              sx={{
                width: { xs: '100%', md: '50%' },
                p: { xs: 4, md: 6 },
                bgcolor: 'rgba(10, 15, 35, 0.72)',
                backdropFilter: 'blur(14px)',
                position: 'relative',
              }}
            >
              {/* Header avec design moderne */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    display: 'inline-block',
                    p: 2,
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 50%, #10b981 100%)',
                    mb: 2,
                    boxShadow: '0 14px 34px rgba(14,165,233,0.35)',
                  }}
                >
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontWeight: 800,
                      color: '#e0f2fe',
                      letterSpacing: '0.6px',
                    }}
                  >
                    Service SAV
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(226, 232, 240, 0.72)',
                    fontWeight: 600,
                  }}
                >
                  Gestion des réclamations & interventions
                </Typography>
              </Box>

              {/* Form Container avec effet glassmorphism */}
              <Box
                sx={{
                  position: 'relative',
                  '& > *': {
                    position: 'relative',
                    zIndex: 1,
                  },
                }}
              >
                <Outlet />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Footer avec effet lumineux */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 4,
            animation: `${pulse} 4s ease-in-out infinite`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(148, 163, 184, 0.8)',
              fontWeight: 500,
            }}
          >
            🔒 © 2024 Service SAV. Vos données sont sécurisées et chiffrées
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout;