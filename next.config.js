/** @type {import('next').NextConfig} */
const nextConfig = {
  // n8n ve API entegrasyonları için gerekli ayarlar
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Ortam değişkenleri - yarın n8n bağlandığında doldurulacak
  env: {
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    META_APP_ID: process.env.META_APP_ID || '',
    GOOGLE_ADS_CLIENT_ID: process.env.GOOGLE_ADS_CLIENT_ID || '',
  },
};

module.exports = nextConfig;
