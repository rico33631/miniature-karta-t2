import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, canvasApi } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

interface Canvas {
  id: string;
  drawing_name: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCanvases();
  }, []);

  const loadCanvases = async () => {
    try {
      setLoading(true);
      const data = await authApi.getCurrentUser();
      setCanvases(data.drawings);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load canvases');
      console.error('Load canvases error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCanvas = async () => {
    if (!newCanvasName.trim()) {
      setError('Canvas name is required');
      return;
    }

    try {
      const canvas = await canvasApi.create(newCanvasName.trim());
      setCreateDialogOpen(false);
      setNewCanvasName('');
      setError('');
      navigate(`/canvas/${canvas.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create canvas');
      console.error('Create canvas error:', err);
    }
  };

  const handleDeleteCanvas = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;

    try {
      await canvasApi.delete(id);
      setCanvases(canvases.filter(c => c.id !== id));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete canvas');
      console.error('Delete canvas error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <div>
            <Typography variant="h4" gutterBottom>
              🗺️ Karta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome, {user?.email}
            </Typography>
          </div>
          <Button variant="outlined" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Create Button */}
        <Box sx={{ mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Canvas
          </Button>
        </Box>

        {/* Canvas Grid */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : canvases.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No canvases yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "New Canvas" to create your first spatial workspace
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {canvases.map((canvas) => (
              <Grid item xs={12} sm={6} md={4} key={canvas.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 },
                    height: '100%',
                  }}
                >
                  <CardContent onClick={() => navigate(`/canvas/${canvas.id}`)}>
                    <Typography variant="h6" gutterBottom>
                      {canvas.drawing_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updated {new Date(canvas.updated_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCanvas(canvas.id, canvas.drawing_name);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Create Canvas Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => {
          setCreateDialogOpen(false);
          setNewCanvasName('');
        }}
      >
        <DialogTitle>Create New Canvas</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Canvas Name"
            fullWidth
            value={newCanvasName}
            onChange={(e) => setNewCanvasName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateCanvas();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setNewCanvasName('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleCreateCanvas} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}