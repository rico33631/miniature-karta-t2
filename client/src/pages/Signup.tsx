import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signUp(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      console.error('Response data:', err.response?.data);
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" gutterBottom>Sign Up</Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" fullWidth>
              Sign Up
            </Button>
          </form>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link to="/login">Already have an account? Login</Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}