/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow better-sqlite3 native module in server-side code
  serverExternalPackages: ["better-sqlite3"],
  // Disable the floating dev indicator in the bottom-right corner
  devIndicators: false,
};

export default nextConfig;
