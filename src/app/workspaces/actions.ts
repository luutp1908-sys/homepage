'use server';

import { revalidatePath } from 'next/cache';
import { CreateWorkspacePayload } from '../../shared/workspaces/workspaces';
import { createWorkspaceForServer, updateWorkspaceMemberRoleForServer } from '../../shared/services/workspacesService';

type RoleUpdatePayload = {
  workspaceId: string;
  memberId: string;
  role: 'ADMIN' | 'MEMBER';
};

export async function createWorkspaceAction(payload: CreateWorkspacePayload) {
  const created = await createWorkspaceForServer(payload);
  revalidatePath('/workspaces');
  return created;
}

export async function updateWorkspaceMemberRoleAction(payload: RoleUpdatePayload) {
  const updated = await updateWorkspaceMemberRoleForServer(payload);
  revalidatePath('/workspaces');
  return updated;
}