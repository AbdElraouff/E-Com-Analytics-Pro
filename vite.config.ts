import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This allows using process.env.API_KEY in the client side code as required
      // We use the provided key as a fallback so the app works immediately
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "AIzaSyCaj2Y7FBBpDD25MRIpK9Kb6h4ZXvVXfRE"),
    },
  };
});