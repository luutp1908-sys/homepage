type SearchParams = { [key: string]: string | string[] | undefined };

function resolveFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function resolveNextPath(searchParams?: SearchParams | Promise<SearchParams>) {
  const resolved = await (searchParams ?? {});
  return resolveFirst(resolved.next);
}
