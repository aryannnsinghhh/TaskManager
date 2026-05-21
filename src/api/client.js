import { apiRoutes } from './routes'

const TOKEN_KEY = 'ttm_token'

export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

const request = async (url, options = {}) => {
  const token = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  auth: {
    login: (email, password) =>
      request(apiRoutes.auth.login, { method: 'POST', body: JSON.stringify({ email, password }) }),
    signup: (full_name, email, password) =>
      request(apiRoutes.auth.signup, { method: 'POST', body: JSON.stringify({ full_name, email, password }) }),
  },
  orgs: {
    list: () => request(apiRoutes.orgs.list),
    create: (name) => request(apiRoutes.orgs.create, { method: 'POST', body: JSON.stringify({ name }) }),
    join: (inviteCode) => request(apiRoutes.orgs.join, { method: 'POST', body: JSON.stringify({ inviteCode }) }),
    invite: (orgId, email) => request(apiRoutes.orgs.invite(orgId), { method: 'POST', body: JSON.stringify({ email }) }),
  },
  projects: {
    listByOrg: (orgId) => request(apiRoutes.projects.listByOrg(orgId)),
    create: (orgId, name) => request(apiRoutes.projects.createInOrg(orgId), { method: 'POST', body: JSON.stringify({ name }) }),
    remove: (projectId) => request(apiRoutes.projects.remove(projectId), { method: 'DELETE' }),
    requestAccess: (projectId) => request(apiRoutes.projects.requestAccess, { method: 'POST', body: JSON.stringify({ projectId }) }),
    generateCode: (projectId) => request(apiRoutes.projects.generateCode(projectId), { method: 'POST' }),
    useCode: (code) => request(apiRoutes.projects.useCode, { method: 'POST', body: JSON.stringify({ code }) }),
    board: (projectId) => request(apiRoutes.projects.board(projectId)),
  },
  requests: {
    byOrg: (orgId) => request(apiRoutes.requests.byOrg(orgId)),
    decide: (projectId, userId, status) => request(apiRoutes.requests.decide, { method: 'POST', body: JSON.stringify({ projectId, userId, status }) }),
  },
  tasks: {
    create: (payload) => request(apiRoutes.tasks.create, { method: 'POST', body: JSON.stringify(payload) }),
    updateStatus: (taskId, status) => request(apiRoutes.tasks.updateStatus(taskId), { method: 'PATCH', body: JSON.stringify({ status }) }),
    reassign: (taskId, assigneeId) => request(apiRoutes.tasks.reassign(taskId), { method: 'PATCH', body: JSON.stringify({ assigneeId }) }),
    remove: (taskId) => request(apiRoutes.tasks.remove(taskId), { method: 'DELETE' }),
  },
}