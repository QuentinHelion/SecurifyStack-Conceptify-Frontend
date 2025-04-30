// src/components/FooterActions.jsx
import React, { useState, forwardRef } from 'react';
import {
    Box,
    Button,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slide,
} from '@mui/material';

const Transition = forwardRef((props, ref) => (
    <Slide direction="up" ref={ref} {...props} />
));

export default function FooterActions({
    onSaveWork,
    onGenerateConfig,
    onClearCache,
    snackbarOpen,
    onCloseSnackbar,
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleClearClick = () => setConfirmOpen(true);
    const handleCancelClear = () => setConfirmOpen(false);
    const handleConfirmClear = () => {
        setConfirmOpen(false);
        onClearCache();
    };

    return (
        <>
            {/* Footer buttons */}
            <Box p={2} display="flex" justifyContent="space-between">
                <Box>
                    <Button variant="contained" color="primary" onClick={onSaveWork}>
                        Save Work
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={onGenerateConfig}
                        sx={{ ml: 1 }}
                    >
                        Generate Config Files
                    </Button>
                </Box>
                <Button variant="outlined" color="error" onClick={handleClearClick}>
                    Clear Cache
                </Button>
            </Box>

            {/* Save confirmation snackbar */}
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

            {/* Clear Cache confirmation dialog */}
            <Dialog
                open={confirmOpen}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleCancelClear}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        p: 2,
                    },
                }}
            >
                <DialogTitle>Clear Cache?</DialogTitle>
                <DialogContent>
                    Are you sure you want to clear your work? This will erase all current edits.
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelClear}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmClear}
                    >
                        Clear
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
