/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow opening dev app via LAN IP (for HMR and dev resources).
  allowedDevOrigins: ['192.168.56.1'],
};

export default nextConfig;
