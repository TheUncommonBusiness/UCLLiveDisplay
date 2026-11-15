const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{8,100}$/.test(value);
const validToken = value => typeof value === 'string' && /^[A-Za-z0-9_-]{24,256}$/.test(value);
export function sessionFromURL(url = location.href) {
  const params = new URL(url).hash.slice(1);
  const values = new URLSearchParams(params);
  const id = values.get('room'), control = values.get('control'), view = values.get('view');
  if (!validId(id) || !validToken(control || view)) return null;
  return {id, token: control || view, role: control ? 'control' : 'view'};
}
export function sessionURL({id, token, role = 'view', displayId}, base = location.href) {
  const url = new URL(displayId ? 'output.html' : 'index.html', base);
  if (displayId) url.searchParams.set('display', displayId);
  url.hash = new URLSearchParams({room: id, [role === 'control' ? 'control' : 'view']: token}).toString();
  return url.href;
}
