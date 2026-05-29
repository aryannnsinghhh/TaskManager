const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const apiRoutes = {
  health: `${API_BASE}/health`,
  auth: {
    login: `${API_BASE}/auth/login`,
    signup: `${API_BASE}/auth/signup`,
    me: `${API_BASE}/auth/me`,
  },
  orgs: {
    list: `${API_BASE}/orgs`,
    create: `${API_BASE}/orgs/create`,
    join: `${API_BASE}/orgs/join`,
    invite: (orgId) => `${API_BASE}/orgs/${orgId}/invite`,
  },
  projects: {
    listByOrg: (orgId) => `${API_BASE}/projects/org/${orgId}`,
    createInOrg: (orgId) => `${API_BASE}/projects/org/${orgId}`,
    remove: (projectId) => `${API_BASE}/projects/${projectId}`,
    requestAccess: `${API_BASE}/projects/request-access`,
    generateCode: (projectId) => `${API_BASE}/projects/${projectId}/generate-code`,
    useCode: `${API_BASE}/projects/use-code`,
    board: (projectId) => `${API_BASE}/projects/${projectId}/board`,
  },
  requests: {
    byOrg: (orgId) => `${API_BASE}/requests/org/${orgId}`,
    decide: `${API_BASE}/requests/decision`,
  },
  tasks: {
    create: `${API_BASE}/tasks`,
    updateStatus: (taskId) => `${API_BASE}/tasks/${taskId}/status`,
    reassign: (taskId) => `${API_BASE}/tasks/${taskId}/assignee`,
    remove: (taskId) => `${API_BASE}/tasks/${taskId}`,
  },
}

export default API_BASE
