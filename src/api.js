// In dev, /api is proxied to the backend (see vite.config.js). For a deployed site set VITE_API_URL to the
// backend's address, e.g. VITE_API_URL=https://thugilcreation-backend.kaiira.in (no trailing slash needed).
const API = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

const TOKEN_KEY = 'thugil-token';
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* private mode: the login just won't be remembered */ } };

async function request(path, { method = 'GET', body, signal, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(`${API}${path}`, { method, headers, signal, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || `Request failed (${res.status})`); e.status = res.status; e.data = data; throw e; }
  return data;
}

// free designs can be downloaded by anyone: the browser just opens this address and saves the file
export const freeDownloadUrl = (id) => `${API}/api/store/free/${encodeURIComponent(id)}/download`;

export const fetchStyles = () => request('/api/store/categories');

export function fetchDesigns({ category, search, offset = 0, limit = 12, signal }) {
  const q = new URLSearchParams({ category: category || 'all', offset: String(offset), limit: String(limit) });
  if (search) q.set('search', search);
  return request(`/api/store/designs?${q}`, { signal });
}

export const fetchCourses = () => request('/api/store/courses');
export const fetchCourse = (id) => request(`/api/store/courses/${encodeURIComponent(id)}`);
export const fetchCourseSummary = () => request('/api/store/courses/summary');

export const login = (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } });
export const fetchMe = () => request('/api/auth/me', { auth: true });
export const startCheckout = (items) => request('/api/store/checkout', { method: 'POST', auth: true, body: { items: items.map((i) => ({ category: i.category, id: i.id })) } });
export const fetchOrder = (id) => request(`/api/store/orders/${encodeURIComponent(id)}`, { auth: true });
export const fetchPurchases = () => request('/api/store/purchases', { auth: true });
// downloads the original file of a bought design (the request carries the login, so it is fetched and then saved)
export async function downloadPurchase(itemId, fallbackName) {
  const res = await fetch(`${API}/api/store/purchases/${itemId}/download`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Download failed (${res.status})`); }
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') || '')?.[1] || fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export const saveReview = (itemId, rating, review) => request(`/api/store/purchases/${itemId}/review`, { method: 'PUT', auth: true, body: { rating, review } });
export const startCourseCheckout = (courseId, pack) => request(`/api/store/courses/${encodeURIComponent(courseId)}/checkout`, { method: 'POST', auth: true, body: { package: pack } });
export const verifyCoursePayment = (payment) => request('/api/store/courses/checkout/verify', { method: 'POST', auth: true, body: payment });
export const fetchAccess = (courseId) => request(`/api/store/courses/${encodeURIComponent(courseId)}/access`, { auth: true });
export const fetchEnrollment = (id) => request(`/api/store/enrollments/${encodeURIComponent(id)}`, { auth: true });
export const fetchMyCourses = () => request('/api/store/learn', { auth: true });
export const fetchLearn = (courseId) => request(`/api/store/learn/${encodeURIComponent(courseId)}`, { auth: true });
// saves how far a lesson has been watched; keepalive lets it finish even while the page is closing
export function saveProgress(courseId, videoId, position, duration) {
  return fetch(`${API}/api/store/learn/${encodeURIComponent(courseId)}/progress`, {
    method: 'POST', keepalive: true,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ video_id: videoId, position_seconds: Math.round(position * 10) / 10, duration_seconds: Math.round(duration) }),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
}
export const saveCourseReview = (courseId, rating, review) => request(`/api/store/learn/${encodeURIComponent(courseId)}/review`, { method: 'PUT', auth: true, body: { rating, review } });
export const fetchMyDoubts = (courseId) => request(`/api/store/learn/${encodeURIComponent(courseId)}/doubts`, { auth: true });
export const askDoubt = (courseId, question, videoId) => request(`/api/store/learn/${encodeURIComponent(courseId)}/doubts`, { method: 'POST', auth: true, body: { question, video_id: videoId || null } });
export const requestCertificate = (courseId, body) => request(`/api/store/learn/${encodeURIComponent(courseId)}/certificate`, { method: 'POST', auth: true, body });
// the certificate file is protected by the login, so it is fetched with it and then saved
export async function downloadCertificate(courseId) {
  const res = await fetch(`${API}/api/store/learn/${encodeURIComponent(courseId)}/certificate/download`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Download failed (${res.status})`); }
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') || '')?.[1] || 'certificate.pdf';
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export const verifyPayment = (payment) => request('/api/store/checkout/verify', { method: 'POST', auth: true, body: payment });

// Razorpay's own checkout window; loaded only when someone pays
let razorpayLoading;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  razorpayLoading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => { razorpayLoading = null; reject(new Error('Could not load the payment window. Check your connection and try again.')); };
    document.head.appendChild(s);
  });
  return razorpayLoading;
}
