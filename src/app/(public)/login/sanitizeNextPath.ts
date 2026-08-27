export function sanitizeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/')) {
    return '/workspaces';
  }

  if (value.startsWith('//')) {
    return '/workspaces';
  }

  if (value.startsWith('/login')) {
    return '/workspaces';
  }

  if (value.includes('\n') || value.includes('\r')) {
    return '/workspaces';
  }

  return value;
}