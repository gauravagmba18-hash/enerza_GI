import "dotenv/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from bundling native Node.js packages
  serverExternalPackages: ["@prisma/client", "pg", "@prisma/adapter-pg", "nodemailer"],
};

export default nextConfig;
