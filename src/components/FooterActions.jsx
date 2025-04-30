// src/components/FooterActions.jsx
import React from 'react';
import { Box, Button, Snackbar, Alert } from '@mui/material';

export default function FooterActions({
    onSaveWork,
    onGenerateConfig,
    snackbarOpen,
    onCloseSnackbar,
}) {
    return (
        <>
            <Box p={2} display="flex" justifyContent="space-between">
                <Button variant="contained" color="primary" onClick={onSaveWork}>
                    Save Work
                </Button>
                <Button variant="contained" color="secondary" onClick={onGenerateConfig}>
                    Generate Config Files
                </Button>
            </Box>

            <Snackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={onCloseSnackbar}
            >
                <Alert
                    onClose={onCloseSnackbar}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    Your work is saved for 10 minutes.
                </Alert>
            </Snackbar>
        </>
    );
}
