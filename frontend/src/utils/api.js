import axios from 'axios';

const API = axios.create({
  baseURL: 'https://kodo-production.up.railway.app/api',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

export const createWorkspace = (data) => API.post('/workspaces', data);
export const getMyWorkspaces = () => API.get('/workspaces/my');
export const getWorkspace = (id) => API.get(`/workspaces/${id}`);
export const joinWorkspace = (data) => API.post('/workspaces/join', data);
export const getWorkspaceMembers = (id) => API.get(`/workspaces/${id}/members`);

export const createProject = (data) => API.post('/projects', data);
export const getProjects = (workspaceId) => API.get(`/projects/workspace/${workspaceId}`);
export const getProject = (id) => API.get(`/projects/${id}`);

export const getTasks = (projectId) => API.get(`/tasks/project/${projectId}`);
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);
export const getTaskComments = (id) => API.get(`/tasks/${id}/comments`);
export const createComment = (id, data) => API.post(`/tasks/${id}/comments`, data);

export const getSnippets = (projectId) => API.get(`/snippets/project/${projectId}`);
export const createSnippet = (data) => API.post('/snippets', data);
export const updateSnippet = (id, data) => API.put(`/snippets/${id}`, data);
export const deleteSnippet = (id) => API.delete(`/snippets/${id}`);

export const getWikiPages = (projectId) => API.get(`/wiki/project/${projectId}`);
export const getWikiPage = (id) => API.get(`/wiki/${id}`);
export const createWikiPage = (data) => API.post('/wiki', data);
export const updateWikiPage = (id, data) => API.put(`/wiki/${id}`, data);
export const deleteWikiPage = (id) => API.delete(`/wiki/${id}`);

export const getActivity = (workspaceId) => API.get(`/activity/workspace/${workspaceId}`);

export const generateStandup = (data) => API.post('/ai/standup', data);
export const summarizeProject = (data) => API.post('/ai/summarize', data);
export const getBlockers = (data) => API.post('/ai/blockers', data);
export const breakdownFeature = (data) => API.post('/ai/breakdown', data);
export const reviewCode = (data) => API.post('/ai/review-code', data);

export default API;