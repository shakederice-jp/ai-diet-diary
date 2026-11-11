import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // finance-tower.com/diet 配下で公開する(親サイト finance-tower の rewrites から転送される)。
  basePath: "/diet",
  async redirects() {
    return [
      {
        // 旧サブドメインは、同じパスのまま新URLへ恒久転送する。
        // 親サイト経由のリクエストは Host が別なので、ここには当たらず転送ループにならない。
        source: "/:path*",
        has: [{ type: "host", value: "diet.finance-tower.com" }],
        destination: "https://finance-tower.com/diet/:path*",
        permanent: true,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
