import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { execSync } from "child_process";

// Detect whether backend is active on port 8001 (standard) or port 8000 (uvicorn default)
function detectBackendPort(): number {
  if (process.env.VITE_BACKEND_PORT) {
    return parseInt(process.env.VITE_BACKEND_PORT, 10);
  }
  try {
    const out8001 = execSync("netstat -ano -p tcp | findstr :8001", {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    if (out8001.includes("LISTENING")) return 8001;
  } catch {}
  try {
    const out8000 = execSync("netstat -ano -p tcp | findstr :8000", {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    if (out8000.includes("LISTENING")) return 8000;
  } catch {}
  return 8001;
}

const backendPort = detectBackendPort();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", (err, req, res: any) => {
            console.error(`[Vite Proxy Error to ${backendPort}]:`, err.message);
            if (res && !res.headersSent && typeof res.writeHead === "function") {
              res.writeHead(503, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  detail: `Cloud Salon backend API is unreachable on port ${backendPort}. Please ensure the FastAPI backend is running.`,
                })
              );
            }
          });
        },
      },
    },
  },
});
