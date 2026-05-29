import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState, useEffect, useCallback  } from 'react'
import { useProjectSocket } from './hooks/useProjectSocket'
import { useUserSocket } from './hooks/useUserSocket'
import { useOrgSocket } from './hooks/useOrgSocket'
import NotificationBanner from './components/NotificationBanner'
import { api, saveToken, clearToken } from './api/client'
import TopBar from './components/TopBar'
import AuthPage from './pages/AuthPage'
import BoardPage from './pages/BoardPage'
import HomePage from './pages/HomePage'
import OrgSelectorPage from './pages/OrgSelectorPage'
import ProjectListPage from './pages/ProjectListPage'
import OrgDashboardPage from './pages/OrgDashboardPage'
import MemberManagementPage from './pages/MemberManagementPage'
import MyTasksPage from './pages/MyTasksPage'
import AccessRequestsPage from './pages/AccessRequestsPage'
import LandingPage from './pages/LandingPage'
import './App.css'

const emptyWorkspace = {
  organizations: [],
  orgMembers: [],
  projects: [],
  projectMembers: [],
  users: [],
  tasks: [],
  orgInvites: [],
  projectInviteCodes: {},
}

function ProjectDetailRoute({
  currentUserId,
  orgProjects,
  workspace,
  userMap,
  isAdmin,
  protectedLayout,
  onAddTask,
  onReorderTasks,
  onReassignTask,
  onDeleteTask,
}) {
  const { projectId } = useParams()
  const project = orgProjects.find((p) => p.id === projectId)
  if (!project) return <Navigate to="/projects" replace />

  const selfMembership = workspace.projectMembers.find(
    (member) => member.projectId === projectId && member.userId === currentUserId,
  )
  const canAccess = isAdmin || selfMembership?.status === 'approved'
  if (!canAccess) return <Navigate to="/projects" replace />

  const approvedMemberIds = workspace.projectMembers
    .filter((member) => member.projectId === projectId && member.status === 'approved')
    .map((member) => member.userId)

  const projectAssignees = workspace.users.filter((user) => approvedMemberIds.includes(user.id))
  const projectTasks = workspace.tasks.filter((task) => task.projectId === projectId)
  const inviteCode = workspace.projectInviteCodes?.[projectId] ?? null

  return protectedLayout(
    <BoardPage
      tasks={projectTasks}
      assignees={projectAssignees}
      userMap={userMap}
      onAddTask={(payload) => onAddTask(projectId, approvedMemberIds, payload)}
      onReorderTasks={(next) => onReorderTasks(projectId, next)}
      onReassignTask={(taskId, assigneeId) => onReassignTask(projectId, approvedMemberIds, taskId, assigneeId)}
      onDeleteTask={(taskId) => onDeleteTask(projectId, taskId)}
      isAdmin={isAdmin}
      currentUserId={currentUserId}
      inviteCode={inviteCode}
    />,
  )
}

function App() {
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(emptyWorkspace)
  const [darkMode, setDarkMode] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [activeOrgId, setActiveOrgId] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, kind) => {
    const id = crypto.randomUUID()
    setNotifications((prev) => [...prev, { id, message, kind }])
  }, [])

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const data = await api.auth.me()
        const userObj = { ...data.user, name: data.user.full_name }
        setCurrentUserId(data.user.id)
        setCurrentUser(userObj)
        if (data.orgMemberships.length > 0) {
          const orgId = data.orgMemberships[0].orgId
          setActiveOrgId(orgId)
          await loadOrgData(data.user.id, orgId, userObj)
        } else {
          setWorkspace({ ...emptyWorkspace, users: [userObj] })
        }
      } catch {
        // token missing or expired — stay on auth page
        clearToken()
      }
    }
    bootstrap()
  }, []) // runs once on mount

  const userOrgMemberships = useMemo(
    () => workspace.orgMembers.filter((member) => member.userId === currentUserId),
    [workspace.orgMembers, currentUserId],
  )
  const hasOrgs = userOrgMemberships.length > 0

  const roleByOrg = useMemo(
    () => userOrgMemberships.reduce((acc, m) => ({ ...acc, [m.orgId]: m.role }), {}),
    [userOrgMemberships],
  )

  const organizations = useMemo(
    () => workspace.organizations.filter((org) => userOrgMemberships.some((m) => m.orgId === org.id)),
    [workspace.organizations, userOrgMemberships],
  )

  const effectiveOrgId = activeOrgId ?? organizations[0]?.id ?? null
  const currentRole = roleByOrg[effectiveOrgId]
  const isAdmin = currentRole === 'admin'

  const orgProjects = workspace.projects.filter((project) => project.orgId === effectiveOrgId)
  const effectiveProjectId = selectedProjectId ?? orgProjects[0]?.id ?? null
  const selectedProject = orgProjects.find((project) => project.id === effectiveProjectId) ?? null

  const orgMembers = useMemo(() => {
    const members = workspace.orgMembers.filter((m) => m.orgId === effectiveOrgId)
    return members.map((m) => {
      const user = workspace.users.find((u) => u.id === m.userId)
      if (!user) return null
      return { id: user.id, name: user.name, email: user.email, role: m.role, status: 'joined' }
    }).filter(Boolean)
  }, [workspace.orgMembers, workspace.users, effectiveOrgId])

  const projectMemberCards = useMemo(() => {
    if (!selectedProject) return []
    return workspace.projectMembers
      .filter((member) => member.projectId === selectedProject.id)
      .map((member) => {
        const user = workspace.users.find((item) => item.id === member.userId)
        if (!user) return null
        const orgMember = workspace.orgMembers.find(
          (item) => item.orgId === selectedProject.orgId && item.userId === user.id,
        )
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: orgMember?.role || 'member',
          status: member.status === 'approved' ? 'joined' : member.status,
          inviteCode: null,
        }
      })
      .filter(Boolean)
  }, [selectedProject, workspace.orgMembers, workspace.projectMembers, workspace.users])

  const accessByProject = useMemo(() => {
    const access = {}
    workspace.projectMembers
      .filter((member) => member.userId === currentUserId)
      .forEach((member) => { access[member.projectId] = member.status })
    return access
  }, [workspace.projectMembers, currentUserId])

  const approvedProjectIds = useMemo(() => new Set(
    workspace.projectMembers
      .filter((member) => member.userId === currentUserId && member.status === 'approved')
      .map((member) => member.projectId),
  ), [workspace.projectMembers, currentUserId])

  const userMap = useMemo(
    () => workspace.users.reduce((acc, user) => ({ ...acc, [user.id]: user.name }), {}),
    [workspace.users],
  )

  const projectMap = useMemo(
    () => workspace.projects.reduce((acc, project) => ({ ...acc, [project.id]: project.name }), {}),
    [workspace.projects],
  )

  const myTasks = useMemo(
    () => workspace.tasks.filter(
      (task) => task.assigneeId === currentUserId && approvedProjectIds.has(task.projectId),
    ),
    [workspace.tasks, currentUserId, approvedProjectIds],
  )

  const groupedRequests = useMemo(() => {
    const pending = workspace.projectMembers.filter((m) => m.status === 'pending')
    const scopedPending = pending.filter((m) => {
      const project = workspace.projects.find((p) => p.id === m.projectId)
      return project?.orgId === effectiveOrgId
    })
    return orgProjects
      .map((project) => {
        const requests = scopedPending
          .filter((member) => member.projectId === project.id)
          .map((member) => {
            const user = workspace.users.find((u) => u.id === member.userId)
            if (!user) return null
            return { userId: user.id, userName: user.name, userEmail: user.email }
          })
          .filter(Boolean)
        return { projectId: project.id, projectName: project.name, requests }
      })
      .filter((group) => group.requests.length > 0)
  }, [workspace.projectMembers, workspace.projects, workspace.users, orgProjects, effectiveOrgId])

  // ── AUTH ──────────────────────────────────────────────────────────────────

  const loadOrgData = async (userId, orgId, userObj) => {
    const [orgsData, projectsData] = await Promise.all([
      api.orgs.list(),
      api.projects.listByOrg(orgId),
    ])
    setWorkspace({
      ...emptyWorkspace,
      organizations: orgsData.organizations,
      orgMembers: orgsData.organizations.map(org => ({
        orgId: org.id,
        userId,
        role: orgsData.roleByOrg[org.id],
      })),
      projects: projectsData.projects,
      projectMembers: Object.entries(projectsData.accessByProject).map(([projectId, status]) => ({
        projectId,
        userId,
        status,
      })),
      users: [userObj],
    })
  }

  const handleLogin = async ({ email, password }) => {
    const data = await api.auth.login(email, password)
    saveToken(data.token)
    const userObj = { ...data.user, name: data.user.full_name }
    setCurrentUserId(data.user.id)
    setCurrentUser(userObj)
    if (data.orgMemberships.length > 0) {
      const orgId = data.orgMemberships[0].orgId
      setActiveOrgId(orgId)
      await loadOrgData(data.user.id, orgId, userObj)
    } else {
      setWorkspace({ ...emptyWorkspace, users: [userObj] })
    }
    navigate('/home')
  }

  const handleSignup = async ({ name, email, password }) => {
    const data = await api.auth.signup(name, email, password)
    saveToken(data.token)
    const userObj = { ...data.user, name: data.user.full_name }
    setCurrentUserId(data.user.id)
    setCurrentUser(userObj)
    setWorkspace({ ...emptyWorkspace, users: [userObj] })
    setActiveOrgId(null)
    navigate('/home')
  }

  const logout = () => {
    clearToken()
    setCurrentUserId(null)
    setCurrentUser(null)
    setActiveOrgId(null)
    setWorkspace(emptyWorkspace)
    navigate('/auth')
  }

  // ── ORGS ──────────────────────────────────────────────────────────────────

  const handleCreateOrg = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const orgName = String(form.get('orgName') || '').trim()
    if (!orgName) return
    const data = await api.orgs.create(orgName)
    const org = data.organization
    const projectsData = await api.projects.listByOrg(org.id)
    setWorkspace((prev) => ({
      ...prev,
      organizations: [...prev.organizations, org],
      orgMembers: [...prev.orgMembers, { orgId: org.id, userId: currentUserId, role: 'admin' }],
      projects: [...prev.projects, ...projectsData.projects],
      projectMembers: [
        ...prev.projectMembers,
        ...Object.entries(projectsData.accessByProject).map(([projectId, status]) => ({
          projectId, userId: currentUserId, status,
        })),
      ],
    }))
    setActiveOrgId(org.id)
    navigate('/org/dashboard')
  }

  const handleJoinByLink = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const code = String(form.get('inviteLink') || '').trim()
    const data = await api.projects.useCode(code)
    const org = data.organization
    const projectsData = await api.projects.listByOrg(org.id)
    setWorkspace((prev) => ({
      ...prev,
      organizations: [...prev.organizations.filter(o => o.id !== org.id), org],
      orgMembers: [...prev.orgMembers, { orgId: org.id, userId: currentUserId, role: 'member' }],
      projects: [...prev.projects.filter(p => p.orgId !== org.id), ...projectsData.projects],
      projectMembers: [
        ...prev.projectMembers,
        ...Object.entries(projectsData.accessByProject).map(([projectId, status]) => ({
          projectId, userId: currentUserId, status,
        })),
      ],
    }))
    setActiveOrgId(org.id)
    navigate('/home')
  }

  const handleSelectOrg = async (orgId) => {
    setActiveOrgId(orgId)
    const projectsData = await api.projects.listByOrg(orgId)
    setWorkspace((prev) => ({
      ...prev,
      projects: [
        ...prev.projects.filter(p => p.orgId !== orgId),
        ...projectsData.projects,
      ],
      projectMembers: [
        ...prev.projectMembers.filter(pm => !projectsData.projects.find(p => p.id === pm.projectId)),
        ...Object.entries(projectsData.accessByProject).map(([projectId, status]) => ({
          projectId, userId: currentUserId, status,
        })),
      ],
    }))
    navigate('/org/dashboard')
  }

  // ── PROJECTS ──────────────────────────────────────────────────────────────

  const handleCreateProject = async (event) => {
    event.preventDefault()
    if (!isAdmin || !effectiveOrgId) return
    const form = event.currentTarget
    const name = String(new FormData(form).get('projectName') || '').trim()
    if (!name) return
    const data = await api.projects.create(effectiveOrgId, name)
    const project = data.project
    setWorkspace((prev) => ({
      ...prev,
      projects: [...prev.projects, project],
      projectMembers: [...prev.projectMembers, { projectId: project.id, userId: currentUserId, status: 'approved' }],
    }))
    form.reset()
  }

  const handleDeleteProject = async (projectId) => {
    if (!isAdmin) return
    await api.projects.remove(projectId)
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== projectId),
      projectMembers: prev.projectMembers.filter((m) => m.projectId !== projectId),
      tasks: prev.tasks.filter((t) => t.projectId !== projectId),
    }))
    if (selectedProjectId === projectId) setSelectedProjectId(null)
  }

  const requestProjectAccess = async (projectId) => {
    if (isAdmin || !currentUserId) return
    await api.projects.requestAccess(projectId)
    setWorkspace((prev) => {
      const existing = prev.projectMembers.find(
        (m) => m.projectId === projectId && m.userId === currentUserId,
      )
      if (existing) {
        return {
          ...prev,
          projectMembers: prev.projectMembers.map((m) =>
            m.projectId === projectId && m.userId === currentUserId ? { ...m, status: 'pending' } : m,
          ),
        }
      }
      return {
        ...prev,
        projectMembers: [...prev.projectMembers, { projectId, userId: currentUserId, status: 'pending' }],
      }
    })
  }

  const openProject = async (projectId) => {
    setSelectedProjectId(projectId)
    const boardData = await api.projects.board(projectId)
    setWorkspace((prev) => {
      const existingIds = new Set(boardData.approvedMembers.map(m => m.id))
      return {
        ...prev,
        tasks: [...prev.tasks.filter(t => t.projectId !== projectId), ...boardData.tasks],
        users: [...prev.users.filter(u => !existingIds.has(u.id)), ...boardData.approvedMembers],
        projectMembers: [
          ...prev.projectMembers.filter(pm => pm.projectId !== projectId),
          ...boardData.approvedMembers.map(m => ({ projectId, userId: m.id, status: 'approved' })),
        ],
        projectInviteCodes: {
          ...prev.projectInviteCodes,
          ...(boardData.inviteCode ? { [projectId]: boardData.inviteCode } : {}),
        },
      }
    })
    navigate(`/projects/${projectId}`)
  }

  const handleGenerateCode = async (projectId) => {
    const data = await api.projects.generateCode(projectId)
    setWorkspace((prev) => ({
      ...prev,
      projectInviteCodes: {
        ...prev.projectInviteCodes,
        [projectId]: data.code,
      },
    }))
  }

  // ── REQUESTS ──────────────────────────────────────────────────────────────

  const handleProjectDecision = async (projectId, userId, status) => {
    if (!isAdmin) return
    await api.requests.decide(projectId, userId, status)
    setWorkspace((prev) => ({
      ...prev,
      projectMembers: prev.projectMembers.map((m) =>
        m.projectId === projectId && m.userId === userId ? { ...m, status } : m,
      ),
    }))
  }

  const loadAccessRequests = async () => {
    if (!effectiveOrgId) return
    const data = await api.requests.byOrg(effectiveOrgId)
    setWorkspace((prev) => {
      const existingIds = new Set(prev.users.map(u => u.id))
      const newMembers = data.requests
        .filter(r => !existingIds.has(r.userId))
        .map(r => ({ id: r.userId, name: r.userName, email: r.userEmail }))
      return {
        ...prev,
        users: [...prev.users, ...newMembers],
        projectMembers: [
          ...prev.projectMembers.filter(pm =>
            !data.requests.find(r => r.userId === pm.userId && r.projectId === pm.projectId)
          ),
          ...data.requests.map(r => ({ projectId: r.projectId, userId: r.userId, status: 'pending' })),
        ],
      }
    })
  }

  // ── TASKS ─────────────────────────────────────────────────────────────────

  const addTask = async (projectId, approvedIds, payload) => {
    try {
      if (!projectId || !approvedIds.includes(payload.assigneeId)) return
      const data = await api.tasks.create({
        projectId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        dueDate: payload.dueDate,
        assigneeId: payload.assigneeId,
      })
      setWorkspace((prev) => ({ ...prev, tasks: [data.task, ...prev.tasks] }))
    } catch (err) {
      alert(err.message)
    }
  }

  const reorderProjectTasks = async (projectId, nextProjectTasks) => {
    const prev = workspace.tasks.filter((t) => t.projectId === projectId)
    const statusChanges = nextProjectTasks.filter((next) => {
      const old = prev.find((t) => t.id === next.id)
      return old && old.status !== next.status
    })

    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.filter((t) => t.projectId !== projectId).concat(nextProjectTasks),
    }))

    for (const task of statusChanges) {
      await api.tasks.updateStatus(task.id, task.status)
    }
  }

  const reassignTask = async (projectId, approvedIds, taskId, assigneeId) => {
    if (!isAdmin || !approvedIds.includes(assigneeId)) return
    await api.tasks.reassign(taskId, assigneeId)
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.projectId === projectId && t.id === taskId ? { ...t, assigneeId } : t,
      ),
    }))
  }

  const deleteTask = async (projectId, taskId) => {
    if (!isAdmin) return
    await api.tasks.remove(taskId)
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => !(t.projectId === projectId && t.id === taskId)),
    }))
  }

  // ── WEBSOCKET ─────────────────────────────────────────────────────────────

  const handleWsEvent = useCallback((event) => {
    const { type, payload } = event

    setWorkspace((prev) => {
      switch (type) {

        case 'task_created': {
          // deduplicate — if we created it ourselves, addTask() already added it
          const exists = prev.tasks.some((t) => t.id === payload.id)
          if (exists) return prev
          return { ...prev, tasks: [payload, ...prev.tasks] }
        }

        case 'task_status_updated': {
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === payload.taskId ? { ...t, status: payload.status } : t
            ),
          }
        }

        case 'task_reassigned': {
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === payload.taskId ? { ...t, assigneeId: payload.assigneeId } : t
            ),
          }
        }

        case 'task_deleted': {
          return {
            ...prev,
            tasks: prev.tasks.filter((t) => t.id !== payload.taskId),
          }
        }

        default:
          return prev
      }
    })
  }, [])

  useProjectSocket(selectedProjectId, handleWsEvent)

  const handleUserEvent = useCallback((event) => {
    if (event.type === 'request_decided') {
      const { projectName, status } = event.payload
      const message = status === 'approved'
        ? `Your request to join "${projectName}" was approved`
        : `Your request to join "${projectName}" was rejected`
      const kind = status === 'approved' ? 'approved' : 'rejected'
      addNotification(message, kind)

      // update local membership state so board becomes accessible immediately
      if (status === 'approved') {
        setWorkspace((prev) => ({
          ...prev,
          projectMembers: prev.projectMembers.map((m) =>
            m.projectId === event.payload.projectId && m.userId === currentUserId
              ? { ...m, status: 'approved' }
              : m
          ),
        }))
      }
    }
  }, [addNotification, currentUserId])

  const handleOrgEvent = useCallback((event) => {
    if (event.type === 'request_decided') {
      const { projectName, userId, status } = event.payload
      const userName = userMap[userId] || 'A member'
      const message = status === 'approved'
        ? `${userName}'s request to join "${projectName}" was approved`
        : `${userName}'s request to join "${projectName}" was rejected`
      addNotification(message, 'info')
    }
  }, [addNotification, userMap])

  useUserSocket(currentUserId, handleUserEvent)
  useOrgSocket(isAdmin ? effectiveOrgId : null, handleOrgEvent)

  // ── MEMBERS ───────────────────────────────────────────────────────────────

  const handleInvite = async ({ projectId, email }) => {
    if (!isAdmin || !effectiveOrgId || !projectId) return
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail) return
    await api.orgs.invite(effectiveOrgId, normalizedEmail)
  }

  const handleRemoveMember = (projectId, memberId) => {
    if (!isAdmin || !projectId) return
    setWorkspace((prev) => ({
      ...prev,
      projectMembers: prev.projectMembers.filter((m) => !(m.projectId === projectId && m.userId === memberId)),
    }))
  }

  // ── LAYOUT ────────────────────────────────────────────────────────────────

  const protectedLayout = (child) => {
    if (!currentUser) return <Navigate to="/auth" replace />
    const orgName = workspace.organizations.find((org) => org.id === effectiveOrgId)?.name
    return (
      <main className={`workspace ${darkMode ? 'theme-dark' : ''}`}>
        <NotificationBanner
          notifications={notifications}
          onDismiss={dismissNotification}
        />
        <TopBar
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((prev) => !prev)}
          onLogout={logout}
          orgName={orgName}
          isAdmin={isAdmin}
          currentUser={currentUser}
        />
        {child}
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage isLoggedIn={Boolean(currentUser)} hasOrgs={hasOrgs} />} />
      <Route path="/auth" element={<AuthPage onLogin={handleLogin} onSignup={handleSignup} />} />
      <Route
        path="/home"
        element={protectedLayout(
          <HomePage
            organizations={organizations}
            currentRoleByOrg={roleByOrg}
            onSelectOrg={handleSelectOrg}
            onCreateOrg={handleCreateOrg}
            onJoinByLink={handleJoinByLink}
          />,
        )}
      />
      <Route
        path="/orgs"
        element={protectedLayout(
          <OrgSelectorPage
            organizations={organizations}
            currentRoleByOrg={roleByOrg}
            onSelectOrg={handleSelectOrg}
            canInvite={isAdmin}
            onInvite={handleInvite}
          />,
        )}
      />
      <Route
        path="/org/dashboard"
        element={protectedLayout(
          <OrgDashboardPage
            orgName={workspace.organizations.find((org) => org.id === effectiveOrgId)?.name || 'Org'}
            role={currentRole || 'member'}
            projects={orgProjects}
            memberCount={orgMembers.length}
            onOpenProject={openProject}
          />,
        )}
      />
      <Route
        path="/projects"
        element={protectedLayout(
          <ProjectListPage
            projects={orgProjects}
            isAdmin={isAdmin}
            accessByProject={accessByProject}
            onOpenProject={openProject}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onRequestAccess={requestProjectAccess}
          />,
        )}
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProjectDetailRoute
            currentUserId={currentUserId}
            orgProjects={orgProjects}
            workspace={workspace}
            userMap={userMap}
            isAdmin={isAdmin}
            protectedLayout={protectedLayout}
            onAddTask={addTask}
            onReorderTasks={reorderProjectTasks}
            onReassignTask={reassignTask}
            onDeleteTask={deleteTask}
          />
        }
      />
      <Route
        path="/requests"
        element={protectedLayout(
          <AccessRequestsPage
            groupedRequests={groupedRequests}
            onDecision={handleProjectDecision}
            onLoad={loadAccessRequests}
          />,
        )}
      />
      <Route
        path="/members"
        element={protectedLayout(
          <MemberManagementPage
            projects={orgProjects}
            selectedProjectId={selectedProjectId}
            members={projectMemberCards}
            isAdmin={isAdmin}
            onGenerateCode={handleGenerateCode}
            onSelectProject={setSelectedProjectId}
            onRemove={handleRemoveMember}
          />,
        )}
      />
      <Route
        path="/my-tasks"
        element={protectedLayout(
          <MyTasksPage
            tasks={myTasks}
            userMap={userMap}
            projectMap={projectMap}
            onOpenProject={openProject}
          />,
        )}
      />
      <Route path="/app/board" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}

export default App