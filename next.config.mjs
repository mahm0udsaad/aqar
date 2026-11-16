/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

const nextConfig = {
  // Served under https://www.alakkareya.com/aqar by cPanel Passenger (see deploy/README.md)
  basePath: basePath || undefined,
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Property forms send images through server actions
      bodySizeLimit: "50mb",
    },
  },
  // The bare base path ("/aqar") never reaches middleware, so send it to the default language here
  async redirects() {
    return [{ source: "/", destination: "/ar", permanent: false }]
  },
  // Local uploads are runtime data, never part of the build output
  outputFileTracingExcludes: { "*": [".uploads/**", "db/**", "*.sql"] },
  // pg is loaded at runtime on the server, not bundled
  serverExternalPackages: ["pg", "sharp"],
}

export default nextConfig
