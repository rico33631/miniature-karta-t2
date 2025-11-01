import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tldraw, Editor, createTLStore, loadSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { canvasApi } from '../config/api';
import { Typography, CircularProgress, Box, AppBar, Toolbar, IconButton, Chip, Button } from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';

export default function Canvas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [canvas, setCanvas] = useState<any>(null);
  const [store, setStore] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [error, setError] = useState('');
  const editorRef = useRef<Editor | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/dashboard');
      return;
    }
    loadCanvas();
  }, [id, navigate]);

  const loadCanvas = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await canvasApi.getById(id);
      setCanvas(data);
      
      // Create new store
      const newStore = createTLStore();
      
      // Load snapshot if available
      if (data?.snapshot && Object.keys(data.snapshot).length > 0) {
        try {
          loadSnapshot(newStore, data.snapshot);
          console.log('Loaded snapshot into store');
        } catch (err) {
          console.error('Failed to load snapshot:', err);
        }
      }
      
      setStore(newStore);
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load canvas');
      console.error('Load canvas error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save function (used by both auto-save and manual save)
  const saveCanvas = useCallback(async () => {
    if (!id || !editorRef.current) return;

    try {
      setSaveStatus('saving');
      const snapshot = editorRef.current.getSnapshot();
      await canvasApi.update(id, snapshot);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save canvas');
      setSaveStatus('unsaved');
    }
  }, [id]);

  // Manual save handler
  const handleManualSave = useCallback(() => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    // Save immediately
    saveCanvas();
  }, [saveCanvas]);

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;

    // Auto-save on changes (3-second debounce)
    const unsubscribe = editor.store.listen(() => {
      setSaveStatus('unsaved');

      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        saveCanvas();
      }, 3000); // 3 seconds
    }, { scope: 'document' });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: Ctrl+S / Cmd+S for manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !canvas) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Typography
          variant="button"
          sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Typography>
      </Box>
    );
  }

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saved': return 'success';
      case 'saving': return 'info';
      case 'unsaved': return 'warning';
      default: return 'default';
    }
  };

  const getSaveStatusLabel = () => {
    switch (saveStatus) {
      case 'saved': return 'Saved';
      case 'saving': return 'Saving...';
      case 'unsaved': return 'Unsaved';
      default: return '';
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            {canvas?.drawing_name || 'Canvas'}
          </Typography>
          <Chip
            label={getSaveStatusLabel()}
            color={getSaveStatusColor()}
            size="small"
            sx={{ fontWeight: 500, mr: 2 }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={saveStatus === 'saving' ? <CircularProgress size={16} /> : <Save />}
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Now'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Canvas */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Tldraw store={store} onMount={handleMount} />
        </div>
      </Box>

      {/* Error Snackbar */}
      {error && canvas && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: 'error.main',
            color: 'white',
            p: 2,
            borderRadius: 1,
            boxShadow: 3,
          }}
        >
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}
    </Box>
  );
}