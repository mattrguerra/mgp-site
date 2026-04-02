// sanity.cli.ts
import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '80ikchxs', // e.g., 'abc123de'
    dataset: 'production'       // e.g., 'production'
  }
})