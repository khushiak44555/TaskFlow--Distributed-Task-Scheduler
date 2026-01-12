module.exports = {
  apps: [
    {
      name: 'taskflow-api',
      script: './services/api/src/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader tsx',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'taskflow-worker',
      script: './services/worker/src/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader tsx',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'taskflow-monitoring',
      script: './services/monitoring/src/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader tsx',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
