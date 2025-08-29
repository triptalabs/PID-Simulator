# Configuración y Despliegue - Simulador PID

## Visión General

Esta documentación describe cómo configurar, construir y desplegar el Simulador PID en diferentes entornos, desde desarrollo local hasta producción.

## Índice

1. [Configuración de Entorno](#configuración-de-entorno)
2. [Build de Producción](#build-de-producción)
3. [Configuración de Servidor](#configuración-de-servidor)
4. [Despliegue](#despliegue)
5. [Monitoreo y Logs](#monitoreo-y-logs)
6. [Optimización de Performance](#optimización-de-performance)
7. [Troubleshooting](#troubleshooting)

## Configuración de Entorno

### Variables de Entorno

```bash
# .env.local (desarrollo local)
VITE_APP_TITLE=PID Simulator
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=http://localhost:3000
VITE_DEBUG_MODE=true

# .env.production
VITE_APP_TITLE=PID Simulator
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://api.pidsimulator.com
VITE_DEBUG_MODE=false
```

### Configuración de Vite

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    
    server: {
      host: env.VITE_HOST || '::',
      port: parseInt(env.VITE_PORT) || 8082,
      strictPort: true,
      open: true
    },
    
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'terser' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            simulation: ['@/lib/simulation'],
            ui: ['@/components/ui']
          }
        }
      },
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      }
    },
    
    worker: {
      format: 'es'
    }
  }
})
```

### Configuración de TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Build de Producción

### Scripts de Build

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "build:staging": "vite build --mode staging",
    "build:prod": "vite build --mode production",
    "preview": "vite preview",
    "analyze": "vite build --mode production && npx vite-bundle-analyzer dist"
  }
}
```

### Configuración de Build por Entorno

```typescript
// vite.config.ts - Configuración por entorno
export default defineConfig(({ mode }) => {
  const configs = {
    development: {
      build: {
        sourcemap: true,
        minify: false
      }
    },
    staging: {
      build: {
        sourcemap: true,
        minify: 'esbuild'
      }
    },
    production: {
      build: {
        sourcemap: false,
        minify: 'terser',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              simulation: ['@/lib/simulation'],
              ui: ['@/components/ui']
            }
          }
        }
      }
    }
  }
  
  return {
    ...configs[mode as keyof typeof configs],
    // Configuración común
  }
})
```

### Optimización de Bundle

```typescript
// vite.config.ts - Optimizaciones avanzadas
export default defineConfig({
  build: {
    // Compresión
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      },
      mangle: {
        safari10: true
      }
    },
    
    // Chunking inteligente
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'react-vendor'
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor'
            }
            return 'vendor'
          }
          if (id.includes('@/lib/simulation')) {
            return 'simulation'
          }
          if (id.includes('@/components/ui')) {
            return 'ui-components'
          }
        }
      }
    },
    
    // Análisis de bundle
    reportCompressedSize: true,
    
    // Assets
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000
  }
})
```

## Configuración de Servidor

### Nginx

```nginx
# /etc/nginx/sites-available/pid-playground
server {
    listen 80;
    server_name pidsimulator.com www.pidsimulator.com;
    
    # Redirección HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pidsimulator.com www.pidsimulator.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/pidsimulator.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pidsimulator.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Root directory
    root /var/www/pid-playground;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (si aplica)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

### Apache

```apache
# /etc/apache2/sites-available/pid-playground.conf
<VirtualHost *:80>
    ServerName pidsimulator.com
    ServerAlias www.pidsimulator.com
    DocumentRoot /var/www/pid-playground
    
    # Redirect to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName pidsimulator.com
    ServerAlias www.pidsimulator.com
    DocumentRoot /var/www/pid-playground
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/pidsimulator.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/pidsimulator.com/privkey.pem
    
    # Security Headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    
    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/plain
        AddOutputFilterByType DEFLATE text/html
        AddOutputFilterByType DEFLATE text/xml
        AddOutputFilterByType DEFLATE text/css
        AddOutputFilterByType DEFLATE application/xml
        AddOutputFilterByType DEFLATE application/xhtml+xml
        AddOutputFilterByType DEFLATE application/rss+xml
        AddOutputFilterByType DEFLATE application/javascript
        AddOutputFilterByType DEFLATE application/x-javascript
    </IfModule>
    
    # Cache static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
    </FilesMatch>
    
    # SPA routing
    <Directory /var/www/pid-playground>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  pid-playground:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Optional: Add monitoring
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped
```

## Despliegue

### Despliegue Manual

```bash
# 1. Build de producción
pnpm run build:prod

# 2. Verificar build
pnpm run preview

# 3. Copiar archivos al servidor
scp -r dist/* user@server:/var/www/pid-playground/

# 4. Configurar permisos
ssh user@server "chmod -R 755 /var/www/pid-playground"
```

### Despliegue Automatizado (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm install -g pnpm && pnpm install
    
    - name: Run tests
      run: pnpm run test
    
    - name: Run linting
      run: pnpm run lint
    
    - name: Type check
      run: pnpm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm install -g pnpm && pnpm install
    
    - name: Build application
      run: pnpm run build:prod
      env:
        VITE_APP_VERSION: ${{ github.sha }}
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-files
        path: dist/
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          # Backup current version
          cp -r /var/www/pid-playground /var/www/pid-playground.backup.$(date +%Y%m%d_%H%M%S)
          
          # Deploy new version
          rm -rf /var/www/pid-playground/*
cp -r dist/* /var/www/pid-playground/
          
          # Set permissions
          chmod -R 755 /var/www/pid-playground
chown -R www-data:www-data /var/www/pid-playground
          
          # Reload nginx
          nginx -t && systemctl reload nginx
```

### Despliegue en Plataformas Cloud

#### Netlify

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "pnpm run build:prod"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### Vercel

```json
// vercel.json
{
  "buildCommand": "pnpm run build:prod",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Monitoreo y Logs

### Configuración de Logs

```typescript
// src/lib/logger.ts
export class Logger {
  private static instance: Logger
  private logLevel: 'debug' | 'info' | 'warn' | 'error'
  
  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
  }
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
  
  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, data)
    }
  }
  
  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, data)
    }
  }
  
  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data)
    }
  }
  
  error(message: string, error?: Error) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error)
    }
  }
  
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }
}

export const logger = Logger.getInstance()
```

### Monitoreo de Performance

```typescript
// src/lib/monitoring.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  startTimer(name: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
    }
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    this.metrics.get(name)!.push(value)
    
    // Keep only last 100 values
    if (this.metrics.get(name)!.length > 100) {
      this.metrics.get(name)!.shift()
    }
  }
  
  getMetrics(name: string) {
    const values = this.metrics.get(name) || []
    if (values.length === 0) return null
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    return { avg, min, max, count: values.length }
  }
  
  reportMetrics() {
    const report: Record<string, any> = {}
    
    for (const [name, values] of this.metrics) {
      report[name] = this.getMetrics(name)
    }
    
    return report
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

### Health Check

```typescript
// src/lib/health.ts
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  checks: {
    worker: boolean
    memory: boolean
    performance: boolean
  }
}

export class HealthChecker {
  private startTime: number = Date.now()
  
  async checkHealth(): Promise<HealthStatus> {
    const checks = {
      worker: await this.checkWorker(),
      memory: this.checkMemory(),
      performance: this.checkPerformance()
    }
    
    const status = this.determineStatus(checks)
    
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: import.meta.env.VITE_APP_VERSION || 'unknown',
      checks
    }
  }
  
  private async checkWorker(): Promise<boolean> {
    // Check if worker is responsive
    return true // Implement actual check
  }
  
  private checkMemory(): boolean {
    const memoryUsage = performance.memory
    return memoryUsage.usedJSHeapSize < memoryUsage.jsHeapSizeLimit * 0.8
  }
  
  private checkPerformance(): boolean {
    const metrics = performanceMonitor.getMetrics('cycle_time')
    return metrics ? metrics.avg < 100 : true // Less than 100ms average
  }
  
  private determineStatus(checks: Record<string, boolean>): HealthStatus['status'] {
    const allChecks = Object.values(checks)
    const healthyChecks = allChecks.filter(Boolean).length
    
    if (healthyChecks === allChecks.length) return 'healthy'
    if (healthyChecks > 0) return 'degraded'
    return 'unhealthy'
  }
}

export const healthChecker = new HealthChecker()
```

## Optimización de Performance

### Lazy Loading

```typescript
// src/components/LazyComponents.tsx
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const ChartsPanel = lazy(() => import('./ChartsPanel'))
const MetricsPanel = lazy(() => import('./MetricsPanel'))

export function LazyChartsPanel(props: any) {
  return (
    <Suspense fallback={<div>Loading charts...</div>}>
      <ChartsPanel {...props} />
    </Suspense>
  )
}
```

### Service Worker para Caching

```typescript
// public/sw.js
const CACHE_NAME = 'pid-playground-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})
```

### Optimización de Imágenes

```typescript
// vite.config.ts - Optimización de assets
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          
          return `assets/[name]-[hash][extname]`
        }
      }
    }
  }
})
```

## Troubleshooting

### Problemas Comunes

#### 1. Worker no se inicializa

```bash
# Verificar logs del navegador
# Habilitar debug mode
VITE_DEBUG_MODE=true pnpm run dev

# Verificar que el worker se carga correctamente
# En DevTools > Network, buscar simulation.worker.js
```

#### 2. Performance lenta

```bash
# Verificar métricas de performance
# En DevTools > Performance, grabar sesión

# Verificar uso de memoria
# En DevTools > Memory, tomar snapshot

# Verificar bundle size
pnpm run analyze
```

#### 3. Errores de CORS

```nginx
# Añadir headers CORS en nginx
add_header Access-Control-Allow-Origin "*";
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
```

#### 4. Problemas de SSL

```bash
# Verificar certificado SSL
openssl s_client -connect pidsimulator.com:443 -servername pidsimulator.com

# Renovar certificado Let's Encrypt
certbot renew --dry-run
```

### Logs de Debug

```typescript
// Habilitar logs detallados
const manager = new WorkerManager({
  debugMode: true,
  timestep: 0.1
})

// Verificar estado del worker
console.log('Worker status:', manager.getStatus())

// Verificar buffer de datos
console.log('Buffer size:', manager.getBufferData().length)
```

### Herramientas de Diagnóstico

```bash
# Verificar configuración de nginx
nginx -t

# Verificar logs de nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Verificar uso de recursos
htop
df -h
free -h

# Verificar puertos abiertos
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

## Conclusión

Esta documentación proporciona una guía completa para configurar y desplegar el Simulador PID en diferentes entornos. Siguiendo estas prácticas, se asegura un despliegue robusto y mantenible.

Para problemas específicos o configuraciones adicionales, consulta la documentación técnica o crea un issue en el repositorio.

---

**Última actualización**: Agosto 2024
**Versión**: 1.0
**Estado**: Documentación completa de despliegue
