import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["10.100.165.201", "192.168.1.131"],
};

export default nextConfig;
