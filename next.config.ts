import type { NextConfig } from "next";
import path from "node:path";

function resolveEditorRemoteBase() {
  const explicit = process.env.NEXT_PUBLIC_EDITOR_REMOTE_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }

  const fallback =
    process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_EDITOR_REMOTE_URL_PROD
      : process.env.NEXT_PUBLIC_EDITOR_REMOTE_URL_LOCAL;

  return (fallback ?? 'http://localhost:5174').replace(/\/+$/, '');
}

const editorRemoteBase = resolveEditorRemoteBase();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack(config, { isServer }) {
    config.plugins.push(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      new (require('@module-federation/nextjs-mf').NextFederationPlugin)({
        name: 'homepage',
        remotes: {
          editor: `editor@${editorRemoteBase}/remoteEntry.js`,
        },
        filename: 'static/chunks/remoteEntry.js',
        shared: {
          react: { singleton: true, requiredVersion: false },
          'react-dom': { singleton: true, requiredVersion: false },
          '@tanstack/react-query': { singleton: true, requiredVersion: false },
        },
      })
    );

    if (!isServer) {
      config.output.publicPath = 'auto';
    }

    return config;
  },
};

export default nextConfig;
