declare module 'editor/EditorRemoteEntry' {
  import type { ComponentType } from 'react';

  type EditorRemoteEntryProps = {
    isEmbedded?: boolean;
    auth?: {
      user: {
        id: string;
        email: string;
        displayName: string | null;
        roles?: string[];
        permissions?: string[];
      } | null;
      accessToken: string | null;
      isLoading?: boolean;
    } | null;
    callbacks?: {
      onRequestLogin?: () => void;
      onLogout?: () => Promise<void> | void;
    } | null;
  };

  const EditorRemoteEntry: ComponentType<EditorRemoteEntryProps>;
  export default EditorRemoteEntry;
}
