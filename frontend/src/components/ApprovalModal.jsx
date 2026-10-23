// src/components/ApprovalModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { apiFetch } from '../api';

const ApprovalModal = ({ open, onClose, execution }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (approved) => {
    setLoading(true);
    setError('');
    try {
      const endpoint = approved
        ? `/api/v1/executions/${execution.id}/approve`
        : `/api/v1/executions/${execution.id}/reject`;
      await apiFetch(endpoint, { method: 'POST' });
      onClose(true); // indicate that data changed
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Review Execution #{execution?.id}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText>
          Playbook ID: {execution?.playbook_id}<br />
          Started at: {new Date(execution?.start_time).toLocaleString()}
        </DialogContentText>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleAction(false)} color="error" disabled={loading}>
          Reject
        </Button>
        <Button onClick={() => handleAction(true)} color="primary" disabled={loading}>
          Approve
        </Button>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalModal;
