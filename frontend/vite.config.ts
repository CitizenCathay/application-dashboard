import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In Docker, the proxy target is the backend service name.
// Locally (outside Docker), it falls back to localhost.
const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on 0.0.0.0 so it's reachable from outside the container
    port: 5173,
    proxy: {
      "/api": proxyTarget,
    },
  },
});