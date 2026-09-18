// ─── Base URL resolution ───────────────────────────────────────────────────
// When visiting via willsparrow.localhost:5173, API calls go to willsparrow.localhost:8000
// When visiting via localhost:5173,             API calls go to localhost:8000
function getApiBaseUrl() {
  const domainSub = getDomainBasedSubdomain();
  if (domainSub) {
    // Domain-based: route to the tenant's domain on port 8000 (Laravel)
    return `http://${domainSub}.localhost:8000/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
}

function extractErrorMessage(response, data) {
  if (data) {
    if (typeof data === 'string' && data.trim().length > 0) return data;
    if (data.message && typeof data.message === 'string') return data.message;
    if (data.error && typeof data.error === 'string') return data.error;
    if (data.errors) {
      if (Array.isArray(data.errors)) return data.errors.join(', ');
      if (typeof data.errors === 'object') return Object.values(data.errors).flat().join(', ');
    }
  }
  switch (response.status) {
    case 400: return 'Bad Request: Invalid parameters sent to the server.';
    case 401: return 'Authentication Failed: Invalid credentials or session expired.';
    case 403: return 'Access Denied: You do not have permission to access this resource.';
    case 404: return 'Not Found: Workspace domain, tenant, or API route does not exist.';
    case 422: return 'Validation Failed: Please check your input fields.';
    case 500: return 'Server Error (500): Internal server failure. Ensure the tenant database exists and backend is running.';
    case 502: return 'Bad Gateway: Backend server is unreachable.';
    case 503: return 'Service Unavailable: Backend service is temporarily offline.';
    default: return `HTTP Error ${response.status}: An unexpected error occurred.`;
  }
}

export function getActiveSubdomain() {
  const storedSubdomain = localStorage.getItem('tenant_subdomain');
  if (storedSubdomain) {
    return storedSubdomain;
  }

  // hostname strips port — so willsparrow.localhost:5173 → willsparrow.localhost
  const host = window.location.hostname;
  const parts = host.split('.');
  if (parts.length >= 2) {
    const sub = parts[0];
    if (sub !== 'www' && sub !== 'localhost' && sub !== 'app' && sub !== '127' && sub !== 'api' && sub !== 'chunkflow') {
      return sub.toLowerCase();
    }
  }

  return 'acme';
}

// Returns the subdomain if the user is visiting via a tenant domain URL
// e.g. http://willsparrow.localhost:5173  → 'willsparrow'
// e.g. http://localhost:5173             → null
export function getDomainBasedSubdomain() {
  const host = window.location.hostname; // no port
  const parts = host.split('.');
  if (parts.length >= 2) {
    const sub = parts[0];
    if (sub !== 'www' && sub !== 'localhost' && sub !== 'app' && sub !== '127' && sub !== 'api' && sub !== 'chunkflow') {
      return sub.toLowerCase();
    }
  }
  return null;
}

export function setActiveSubdomain(subdomain) {
  if (subdomain) {
    localStorage.setItem('tenant_subdomain', subdomain.toLowerCase());
  } else {
    localStorage.removeItem('tenant_subdomain');
  }
}

export function getToken() {
  return localStorage.getItem('token');
}

export function isSuperAdminSession() {
  return localStorage.getItem('is_super_admin') === 'true';
}

export function setAuthSession(token, user, tenant, isSuperAdmin = false) {
  localStorage.setItem('token', token);
  localStorage.setItem('is_super_admin', isSuperAdmin ? 'true' : 'false');
  if (user) localStorage.setItem('user', JSON.stringify(user));
  if (tenant) {
    localStorage.setItem('tenant', JSON.stringify(tenant));
    if (tenant.subdomain) {
      localStorage.setItem('tenant_subdomain', tenant.subdomain);
    }
  }
}

export function clearAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tenant');
  localStorage.removeItem('tenant_subdomain');
  localStorage.removeItem('is_super_admin');
}

// ─── Request helper ────────────────────────────────────────────────────────
const isDomainBased = !!getDomainBasedSubdomain();

async function request(endpoint, options = {}) {
  const token = getToken();
  const API_BASE_URL = getApiBaseUrl();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Only send X-Tenant-Subdomain header for header-based (central) requests
  if (!isDomainBased) {
    const subdomain = getActiveSubdomain();
    headers['X-Tenant-Subdomain'] = subdomain;
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response, data;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    data = await response.json().catch(() => ({}));
  } catch (netErr) {
    throw new Error('Network Error: Unable to connect to backend server at ' + API_BASE_URL);
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(response, data));
  }

  return data;
}

// ─── Central request (always hits localhost:8000) ─────────────────────────
async function centralRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response, data;
  try {
    response = await fetch(`http://localhost:8000/api/v1${endpoint}`, {
      ...options,
      headers,
    });
    data = await response.json().catch(() => ({}));
  } catch (netErr) {
    throw new Error('Network Error: Unable to connect to central backend server at http://localhost:8000');
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(response, data));
  }

  return data;
}

export const api = {
  // ─── Auth & Tenant Management ────────────────────────────────────────────
  registerTenant: (tenantData) => centralRequest('/auth/register-tenant', {
    method: 'POST',
    body: JSON.stringify(tenantData),
  }),

  // Login: domain-based uses tenant route (/api/v1/auth/login on tenant domain)
  // Header-based uses central route with X-Tenant-Subdomain header
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  getMe: () => request('/auth/me'),

  getTenants: () => centralRequest('/tenants'),

  getRLSStatus: () => request('/rls-status'),

  // ─── Central Super Admin APIs (always central) ────────────────────────────
  superAdminLogin: (credentials) => centralRequest('/superadmin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  getSuperAdminDashboard: () => centralRequest('/superadmin/dashboard'),

  // ─── Projects CRUD (Tenant Scoped) ────────────────────────────────────────
  getProjects: () => request('/projects'),

  createProject: (projectData) => request('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  }),

  deleteProject: (id) => request(`/projects/${id}`, {
    method: 'DELETE',
  }),

  // ─── Documents & S3 Bucket Data ───────────────────────────────────────────
  getDocuments: () => request('/documents'),

  createDocument: (docData) => request('/documents', {
    method: 'POST',
    body: JSON.stringify(docData),
  }),
};
