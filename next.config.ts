import type { NextConfig } from "next";
import path from "node:path";

const editorRemoteBase = (process.env.NEXT_PUBLIC_EDITOR_REMOTE_URL ?? 'http://localhost:5174').replace(/\/+$/, '');

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
