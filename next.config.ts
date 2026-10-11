import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/universal-restaurant-pos", // Repo name
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
