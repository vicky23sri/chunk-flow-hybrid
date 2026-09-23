const LARAVEL_API_BASE = import.meta.env.VITE_LARAVEL_API_URL || 'http://localhost:8000/api/v1';
const GO_API_BASE = import.meta.env.VITE_GO_API_URL || 'http://localhost:8080/api/v1';

// ─── Base URL resolution ───────────────────────────────────────────────────
// Dynamically builds tenant subdomain API URL from VITE_LARAVEL_API_URL
function getApiBaseUrl() {
  const domainSub = getDomainBasedSubdomain();
  if (domainSub) {
    try {
      const url = new URL(LARAVEL_API_BASE);
      const portStr = url.port ? `:${url.port}` : '';
      return `${url.protocol}//${domainSub}.${url.hostname}${portStr}${url.pathname}`;
    } catch (e) {
      return LARAVEL_API_BASE;
    }
  }
  return LARAVEL_API_BASE;
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

// ─── Central request (always hits central Laravel backend) ─────────────────
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
    response = await fetch(`${LARAVEL_API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    data = await response.json().catch(() => ({}));
  } catch (netErr) {
    throw new Error('Network Error: Unable to connect to central backend server at ' + LARAVEL_API_BASE);
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

  // ─── Go Backend PostgreSQL Connection Test API ────────────────────────────
  testDBConnection: async (config) => {
    try {
      const res = await fetch(`${GO_API_BASE}/test-db-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          message: data.message || `HTTP ${res.status}: Backend error.`,
        };
      }
      return data;
    } catch (err) {
      return {
        success: false,
        message: `Network Error: Unable to reach Go Backend at ${GO_API_BASE}. Please ensure \`go run cmd/main.go\` is running in go_backend directory.`,
      };
    }
  },

  // ─── Go Backend: Save node config to tenant DB via /tenant-config ─────────
  saveTenantConfig: async (payload) => {
    const subdomain = getActiveSubdomain() || 'default';
    try {
      const res = await fetch(`${GO_API_BASE}/tenant-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': subdomain,
        },
        body: JSON.stringify({ subdomain, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.success !== false, message: data.message, ...data };
    } catch (err) {
      return {
        success: false,
        message: `Network Error: Cannot reach Go Backend at ${GO_API_BASE}.`,
      };
    }
  },

  // ─── Go Backend: Read back saved node configs via GET /tenant-config ─────
  getTenantConfig: async () => {
    const subdomain = getActiveSubdomain() || 'default';
    try {
      const res = await fetch(`${GO_API_BASE}/tenant-config?subdomain=${encodeURIComponent(subdomain)}`, {
        headers: {
          'X-Tenant-Subdomain': subdomain,
        },
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.success !== false, postgres: data.postgres || [], s3: data.s3 || [] };
    } catch (err) {
      return { success: false, postgres: [], s3: [] };
    }
  },

  // ─── Go Backend: Deploy workflow pipeline to tenant DB via /workflow/deploy ──
  deployWorkflow: async (payload) => {
    const subdomain = getActiveSubdomain() || 'default';
    try {
      const res = await fetch(`${GO_API_BASE}/workflow/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': subdomain,
        },
        body: JSON.stringify({ subdomain, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.success !== false, message: data.message, ...data };
    } catch (err) {
      return {
        success: false,
        message: `Network Error: Cannot reach Go Backend at ${GO_API_BASE}.`,
      };
    }
  },

  // ─── Go Backend: Get deployed workflows for tenant ────────────────────────
  getWorkflows: async () => {
    const subdomain = getActiveSubdomain() || 'default';
    try {
      const res = await fetch(`${GO_API_BASE}/workflows?subdomain=${encodeURIComponent(subdomain)}`, {
        headers: {
          'X-Tenant-Subdomain': subdomain,
        },
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.success !== false, workflows: data.workflows || [] };
    } catch (err) {
      return { success: false, workflows: [] };
    }
  },

  // ─── Go Backend: List CDC snapshots from master.csv ───────────────────────
  listSnapshots: async () => {
    try {
      const res = await fetch(`${GO_API_BASE}/list-snapshots`);
      if (!res.ok) return [];
      const data = await res.json().catch(() => []);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching snapshots list:', err);
      return [];
    }
  },

  // ─── Go Backend: Get total CDC physical chunk size ────────────────────────
  getChunkSize: async () => {
    try {
      const res = await fetch(`${GO_API_BASE}/chunk-size`);
      if (!res.ok) return { physical_size_bytes: 0 };
      const data = await res.json().catch(() => ({ physical_size_bytes: 0 }));
      return data;
    } catch (err) {
      console.error('Error fetching chunk size:', err);
      return { physical_size_bytes: 0 };
    }
  },

  // ─── Go Backend: Download snapshot hash details ─────────────────────────────
  downloadSnapshot: async (manifestId) => {
    try {
      const res = await fetch(`${GO_API_BASE}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: manifestId }),
      });
      if (!res.ok) throw new Error(`Download failed with status ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snapshot-${manifestId}-hashes.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Error downloading snapshot hash details:', err);
      throw err;
    }
  },
  // ─── Go Backend: Connectors & Configurations (4-table Architecture) ─────
  getConnectors: async () => {
    const subdomain = getActiveSubdomain() || 'default';
    try {
      const res = await fetch(`${GO_API_BASE}/connectors?subdomain=${encodeURIComponent(subdomain)}`, {
        headers: { 'X-Tenant-Subdomain': subdomain },
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.success !== false, data: data.data || [] };
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  createConnector: async (name) => {
    const subdomain = getActiveSubdomain() || 'default';
    try {
      const res = await fetch(`${GO_API_BASE}/connectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Subdomain': subdomain },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.success !== false, ...data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  getConfigurations: async () => {
    const subdomain = getActiveSubdomain() || 'default';
    try {
      const res = await fetch(`${GO_API_BASE}/configurations?subdomain=${encodeURIComponent(subdomain)}`, {
        headers: { 'X-Tenant-Subdomain': subdomain },
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.success !== false, data: data.data || [] };
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  saveConfiguration: async (payload) => {
    const subdomain = getActiveSubdomain() || 'default';
    try {
      const res = await fetch(`${GO_API_BASE}/configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Subdomain': subdomain },
        body: JSON.stringify({ subdomain, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.success !== false, ...data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
};

// Named exports for convenient direct importing
export const getTenantConfig = (...args) => api.getTenantConfig(...args);
export const getWorkflows = (...args) => api.getWorkflows(...args);
export const deployWorkflow = (...args) => api.deployWorkflow(...args);
export const saveTenantConfig = (...args) => api.saveTenantConfig(...args);
export const testDBConnection = (...args) => api.testDBConnection(...args);
export const listSnapshots = (...args) => api.listSnapshots(...args);
export const getChunkSize = (...args) => api.getChunkSize(...args);
export const downloadSnapshot = (...args) => api.downloadSnapshot(...args);
export const getConnectors = (...args) => api.getConnectors(...args);
export const createConnector = (...args) => api.createConnector(...args);
export const getConfigurations = (...args) => api.getConfigurations(...args);
export const saveConfiguration = (...args) => api.saveConfiguration(...args);


