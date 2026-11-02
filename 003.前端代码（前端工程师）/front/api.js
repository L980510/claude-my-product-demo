/* ===== 消费记账 · API 客户端 =====
 * 统一 fetch 封装：自动带 token、统一错误处理、401 跳登录
 */
const API_BASE = 'http://localhost:8080/api';

let onUnauthorized = null;

function getToken() {
  return localStorage.getItem('xjz_token') || sessionStorage.getItem('xjz_token');
}
function setToken(token, remember) {
  (remember ? localStorage : sessionStorage).setItem('xjz_token', token);
}
function clearToken() {
  localStorage.removeItem('xjz_token');
  sessionStorage.removeItem('xjz_token');
}
function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(API_BASE + path, { ...options, headers });
  } catch (e) {
    throw new Error('网络错误，请确认后端服务已启动');
  }

  if (res.status === 401) {
    clearToken();
    if (onUnauthorized) onUnauthorized();
    throw new Error('未登录或登录已过期');
  }

  let body;
  try {
    body = await res.json();
  } catch (e) {
    throw new Error('响应解析失败');
  }

  if (body.code !== 0) {
    throw new Error(body.message || '请求失败');
  }
  return body.data;
}

const http = {
  get: (path) => api(path),
  post: (path, data) => api(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => api(path, { method: 'PUT', body: JSON.stringify(data) }),
  del: (path) => api(path, { method: 'DELETE' })
};
