import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';
import ProjectTasksPage from './pages/ProjectTasksPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ProjectTasksPage />
    </QueryClientProvider>
  </React.StrictMode>
);
