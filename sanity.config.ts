// Sanity Studio configuration
// To use: run `npx sanity dev` or deploy to /studio on your domain
// First time: run `npx sanity init` to create a project and get your project ID

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './sanity/schemas';

export default defineConfig({
  name: 'mgp-studio',
  title: 'Matt Guerra Photography',
  projectId: '80ikchxs',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
