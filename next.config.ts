import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // iyzipay eski bir CommonJS SDK'sı — kendi dizinini dinamik `require` ile tarıyor,
  // bu da Turbopack/webpack'in statik bundle analiziyle uyuşmuyor. Native Node
  // require'a bırakılması gerekiyor.
  serverExternalPackages: ["iyzipay"],
};

export default nextConfig;
