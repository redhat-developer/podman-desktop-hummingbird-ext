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
      '/@store/*': './src/stores/*',
    },
    output: {
      bundleStrategy: 'inline',
    },
    typescript: {
      config: tsconfig => {
        tsconfig['include'] = [...tsconfig['include'], '../../../types/**/*.d.ts', '../vite.tests.setup.ts'];
        return tsconfig;
      },
    },
  },
};

export default config;
