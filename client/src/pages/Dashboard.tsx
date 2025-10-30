import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Box, Typography, Button, Paper } from '@mui/material';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Container>
      <Box sx={{ mt: 10 }}>
        <Paper sx={{ p: 10 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Welcome, {user?.email}
          </Typography>
          <Button variant="contained" onClick={handleLogout}>
            Logout
          </Button>
        </Paper>
      </Box>
      {
        user && user.drawings && user.drawings.length > 0 ? (
          <Box sx={{ mt: 5 }}>
            <Typography variant="h5" gutterBottom>
              Your Drawings
            </Typography>
            {user.drawings.map((drawing: any) => (
              <Paper key={drawing.id} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6">{drawing.title}</Typography>
                <Typography variant="body2">{drawing.description}</Typography>
              </Paper>
            ))}
          </Box>
        ) : (
          <Box sx={{ mt: 5 }}>
            <Typography variant="h6">You have no drawings yet.</Typography>
          </Box>
        )
      }
    </Container>
  );
}