import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <BusinessIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          CRE Research Agent
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Header; 