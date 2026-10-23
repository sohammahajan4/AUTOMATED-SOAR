// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, List, ListItem, ListItemText, Button, Box, CircularProgress, Alert } from '@mui/material';
import { apiFetch } from '../api';
import ApprovalModal from '../components/ApprovalModal';

const Dashboard = () => {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExec, setSelectedExec] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/v1/executions');
      // Show only executions awaiting approval for demo
      const pending = data.filter((e) => e.status === 'waiting_approval');
      setExecutions(pending);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  const handleApprove = (exec) => {
    setSelectedExec(exec);
    setModalOpen(true);
  };

  const handleModalClose = (updated) => {
    setModalOpen(false);
    setSelectedExec(null);
    if (updated) {
      fetchExecutions();
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Executions Awaiting Approval
        </Typography>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && executions.length === 0 && <Typography>No pending approvals.</Typography>}
        <List>
          {executions.map((exec) => (
            <ListItem key={exec.id} secondaryAction={
              <Button variant="contained" color="primary" onClick={() => handleApprove(exec)}>
                Review
              </Button>
            }>
              <ListItemText
                primary={`Playbook #${exec.playbook_id}`}
                secondary={`Created at: ${new Date(exec.start_time).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      {selectedExec && (
        <ApprovalModal
          open={modalOpen}
          onClose={handleModalClose}
          execution={selectedExec}
        />
      )}
    </Container>
  );
};

export default Dashboard;
