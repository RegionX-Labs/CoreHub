/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['github.com'],
  },
  env: {
    WS_ROCOCO_CORETIME_CHAIN: process.env.WS_ROCOCO_CORETIME_CHAIN || '',
    WS_KUSAMA_CORETIME_CHAIN: process.env.WS_KUSAMA_CORETIME_CHAIN || '',
    WS_WESTEND_CORETIME_CHAIN: process.env.WS_WESTEND_CORETIME_CHAIN || '',

    SUBSCAN_CORETIME_ROCOCO_INDEXER:
      process.env.SUBSCAN_CORETIME_ROCOCO_INDEXER || '',
    SUBSCAN_CORETIME_KUSAMA_INDEXER:
      process.env.SUBSCAN_CORETIME_KUSAMA_INDEXER || '',
    SUBSCAN_CORETIME_WESTEND_INDEXER:
      process.env.SUBSCAN_CORETIME_WESTEND_INDEXER || '',

    SUBSCAN_CORETIME_ROCOCO_DICT:
      process.env.SUBSCAN_CORETIME_ROCOCO_DICT || '',
    SUBSCAN_CORETIME_KUSAMA_DICT:
      process.env.SUBSCAN_CORETIME_KUSAMA_DICT || '',
    SUBSCAN_CORETIME_WESTEND_DICT:
      process.env.SUBSCAN_CORETIME_WESTEND_DICT || '',

    WS_REGIONX_COCOS_CHAIN: process.env.WS_REGIONX_COCOS_CHAIN || '',

    WS_ROCOCO_RELAY_CHAIN: process.env.WS_ROCOCO_RELAY_CHAIN,
    WS_KUSAMA_RELAY_CHAIN: process.env.WS_KUSAMA_RELAY_CHAIN,
    WS_WESTEND_RELAY_CHAIN: process.env.WS_WESTEND_RELAY_CHAIN,

    EXPERIMENTAL: process.env.EXPERIMENTAL,
  },
};

module.exports = nextConfig;
