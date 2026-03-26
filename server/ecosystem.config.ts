interface PM2Config {
  apps: Array<{
    name: string;
    script: string;
    instances: string | number;
    exec_mode: 'cluster' | 'fork';
    env: Record<string, string | number>;
    error_file: string;
    out_file: string;
    log_file: string;
    time: boolean;
    max_restarts: number;
    restart_delay: number;
    watch: boolean;
    autorestart: boolean;
  }>;
}

const config: PM2Config = {
  apps: [
    {
      name: 'social-api',
      script: './dist/src/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      autorestart: true,
    },
  ],
};