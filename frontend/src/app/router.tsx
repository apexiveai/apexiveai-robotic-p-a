
import {
  createBrowserRouter,
  Navigate,
} from 'react-router-dom'

import AppShell from '../components/layout/AppShell'
import Dashboard from '../modules/dashboard/Dashboard'
import Designer from '../modules/designer/Designer'
import ModulePage from '../modules/workspace/ModulePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'designer',
        element: <Designer />,
      },
      {
        path: 'activities',
        element: <ModulePage />,
      },
      {
        path: 'projects',
        element: <ModulePage />,
      },
      {
        path: 'processes',
        element: <ModulePage />,
      },
      {
        path: 'jobs',
        element: <ModulePage />,
      },
      {
        path: 'robots',
        element: <ModulePage />,
      },
      {
        path: 'machines',
        element: <ModulePage />,
      },
      {
        path: 'queues',
        element: <ModulePage />,
      },
      {
        path: 'assets',
        element: <ModulePage />,
      },
      {
        path: 'packages',
        element: <ModulePage />,
      },
      {
        path: 'triggers',
        element: <ModulePage />,
      },
      {
        path: 'monitoring',
        element: <ModulePage />,
      },
      {
        path: 'logs',
        element: <ModulePage />,
      },
      {
        path: 'analytics',
        element: <ModulePage />,
      },
      {
        path: 'ai-automation',
        element: <ModulePage />,
      },
      {
        path: 'organizations',
        element: <ModulePage />,
      },
      {
        path: 'users',
        element: <ModulePage />,
      },
      {
        path: 'integrations',
        element: <ModulePage />,
      },
      {
        path: 'licensing',
        element: <ModulePage />,
      },
      {
        path: 'settings',
        element: <ModulePage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
