export function sanitizeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/')) {
    return '/workspaces';
  }

  if (value.startsWith('//')) {
    return '/workspaces';
  }

  return value;
}