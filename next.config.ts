import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //basePath: "/mdiary",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  allowedDevOrigins: ["rhyme.mine.nu"],
};

export default nextConfig;
