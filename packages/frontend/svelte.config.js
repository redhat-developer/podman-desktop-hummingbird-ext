import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: '../backend/media',
      assets: '../backend/media',
      strict: false,
    }),
    prerender: {
      handleUnseenRoutes: 'ignore',
    },
    paths: {
      relative: false,
    },
    alias: {
      '/@/*': './src/*',
      '/@shared/*': '../shared/*',
      '/@store/*': './src/stores/*',
    },
    output: {
      bundleStrategy: 'inline',
    },
  },
};

export default config;
