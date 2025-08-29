# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir al PID Playground! Este documento te guiará a través del proceso de contribución.

## 📋 Tabla de Contenidos

- [🎯 Cómo Contribuir](#-cómo-contribuir)
- [🐛 Reportar Problemas](#-reportar-problemas)
- [💡 Sugerir Mejoras](#-sugerir-mejoras)
- [🔧 Configuración del Entorno](#-configuración-del-entorno)
- [📝 Estándares de Código](#-estándares-de-código)
- [🧪 Testing](#-testing)
- [📚 Documentación](#-documentación)
- [🚀 Proceso de Pull Request](#-proceso-de-pull-request)

## 🎯 Cómo Contribuir

### Tipos de Contribuciones

1. **🐛 Bug Reports** - Reportar problemas encontrados
2. **💡 Feature Requests** - Sugerir nuevas funcionalidades
3. **🔧 Code Contributions** - Implementar mejoras o correcciones
4. **📚 Documentation** - Mejorar o agregar documentación
5. **🧪 Testing** - Agregar o mejorar tests

## 🐛 Reportar Problemas

### Antes de Reportar

1. **Buscar en issues existentes** - Evita duplicados
2. **Verificar la versión** - Asegúrate de usar la última versión
3. **Reproducir el problema** - Confirma que es reproducible

### Template de Bug Report

```markdown
## 🐛 Descripción del Problema

### Resumen
Descripción breve del problema

### Pasos para Reproducir
1. Ir a '...'
2. Hacer clic en '...'
3. Scroll hasta '...'
4. Ver error

### Comportamiento Esperado
Lo que debería suceder

### Comportamiento Actual
Lo que realmente sucede

### Información del Sistema
- **OS**: Windows 10 / macOS / Linux
- **Browser**: Chrome / Firefox / Safari
- **Versión**: v1.0.0
- **Node.js**: 18.x

### Logs y Screenshots
```
[Logs de consola aquí]
```

### Contexto Adicional
Cualquier información adicional relevante
```

## 💡 Sugerir Mejoras

### Template de Feature Request

```markdown
## 💡 Nueva Funcionalidad

### Problema que Resuelve
Descripción del problema o necesidad

### Solución Propuesta
Descripción de la solución

### Alternativas Consideradas
Otras soluciones evaluadas

### Impacto
- **Usuarios afectados**: Quién se beneficia
- **Prioridad**: Alta/Media/Baja
- **Esfuerzo estimado**: Tiempo aproximado

### Mockups/Prototipos
[Enlaces a mockups si aplica]
```

## 🔧 Configuración del Entorno

### Prerequisitos

- **Node.js** 18+
- **pnpm** (recomendado) o npm
- **Git**

### Configuración Inicial

```bash
# 1. Fork del repositorio
# Ve a https://github.com/triptalabs/pid-playground
# Haz clic en "Fork"

# 2. Clona tu fork
git clone https://github.com/YOUR_USERNAME/pid-playground.git
cd pid-playground

# 3. Agrega el repositorio original como upstream
git remote add upstream https://github.com/original-owner/pid-playground.git

# 4. Instala dependencias
pnpm install

# 5. Verifica la instalación
pnpm test
pnpm lint
```

### Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   └── custom/         # Componentes personalizados
├── lib/                # Utilidades y lógica
│   ├── simulation/     # Lógica de simulación
│   └── utils/          # Utilidades generales
├── pages/              # Páginas de la aplicación
├── hooks/              # Hooks personalizados
├── config/             # Configuración
└── workers/            # Web Workers

tests/                  # Tests unitarios e integración
docs/                   # Documentación
```

## 📝 Estándares de Código

### TypeScript

- **Tipado estricto** - Evita `any` cuando sea posible
- **Interfaces explícitas** - Define tipos para todas las props
- **Generics** - Usa cuando sea apropiado
- **Documentación JSDoc** - Para funciones complejas

```typescript
/**
 * Calcula la respuesta del controlador PID
 * @param setpoint - Valor objetivo
 * @param processVariable - Variable de proceso actual
 * @param params - Parámetros del PID
 * @returns Salida del controlador y componentes
 */
export function computePID(
  setpoint: number,
  processVariable: number,
  params: PIDParameters
): PIDOutput {
  // Implementación
}
```

### React

- **Functional Components** - Usa hooks en lugar de clases
- **Props tipadas** - Define interfaces para props
- **Memoización** - Usa `React.memo` y `useMemo` apropiadamente
- **Custom Hooks** - Extrae lógica reutilizable

```typescript
interface ChartProps {
  data: ChartDataPoint[]
  timeWindow: TimeWindow
  isRunning: boolean
}

export const Chart: React.FC<ChartProps> = React.memo(({ 
  data, 
  timeWindow, 
  isRunning 
}) => {
  // Componente
})
```

### Estilo de Código

- **ESLint** - Sigue las reglas configuradas
- **Prettier** - Formateo automático
- **Nombres descriptivos** - Variables y funciones claras
- **Comentarios** - Explica el "por qué", no el "qué"

### Commits

- **Conventional Commits** - Usa el formato estándar
- **Mensajes claros** - Describe el cambio brevemente
- **Referencia issues** - Incluye `#123` cuando aplique

```bash
# Formato: tipo(alcance): descripción
feat(pid): agregar anti-windup por back-calculation
fix(charts): corregir escala de gráficas en modo móvil
docs(readme): actualizar instrucciones de instalación
test(worker): agregar tests para manejo de errores
```

## 🧪 Testing

### Tipos de Tests

1. **Unit Tests** - Funciones individuales
2. **Integration Tests** - Interacción entre componentes
3. **E2E Tests** - Flujos completos de usuario

### Escribir Tests

```typescript
import { describe, it, expect } from 'vitest'
import { PIDController } from '@/lib/simulation/pid-controller'

describe('PIDController', () => {
  it('should compute correct output for step response', () => {
    const pid = new PIDController({
      kp: 2.0,
      ki: 0.1,
      kd: 5.0
    }, 0.1)
    
    const result = pid.compute(60, 25)
    
    expect(result.u).toBeGreaterThan(0)
    expect(result.P_term).toBeCloseTo(70, 1)
  })
})
```

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests en modo watch
pnpm test:ui

# Tests específicos
pnpm test --run tests/pid.test.ts
```

## 📚 Documentación

### Tipos de Documentación

1. **README** - Visión general del proyecto
2. **API Docs** - Documentación técnica
3. **User Guides** - Guías de usuario
4. **Code Comments** - Comentarios en código

### Estándares

- **Markdown** - Usa formato consistente
- **Diagramas Mermaid** - Para flujos y arquitectura
- **Ejemplos de código** - Incluye ejemplos prácticos
- **Enlaces** - Mantén enlaces actualizados


## 🚀 Proceso de Pull Request

### 1. Preparación

```bash
# Crear branch desde main
git checkout main
git pull upstream main
git checkout -b feature/nueva-funcionalidad

# Hacer cambios
# ... editar archivos ...

# Commit con mensaje descriptivo
git add .
git commit -m "feat: agregar nueva funcionalidad X"
```

### 2. Testing

```bash
# Ejecutar tests
pnpm test

# Verificar linting
pnpm lint

# Build de producción
pnpm build
```

### 3. Crear Pull Request

1. **Push a tu fork**
   ```bash
   git push origin feature/nueva-funcionalidad
   ```

2. **Crear PR en GitHub**
   - Usa el template de PR
   - Describe los cambios claramente
   - Incluye screenshots si aplica
   - Referencia issues relacionados

### Template de Pull Request

```markdown
## 📝 Descripción

### Cambios Realizados
- [ ] Nueva funcionalidad
- [ ] Corrección de bug
- [ ] Mejora de documentación
- [ ] Refactoring

### Problema Resuelto
Closes #123

### Cambios Principales
- Agregar función X
- Corregir bug en Y
- Mejorar performance de Z

### Testing
- [ ] Tests unitarios pasan
- [ ] Tests de integración pasan
- [ ] Build de producción exitoso
- [ ] Manual testing realizado

### Screenshots
[Si aplica]

### Checklist
- [ ] Código sigue estándares del proyecto
- [ ] Documentación actualizada
- [ ] Tests agregados/actualizados
- [ ] Commits siguen conventional commits
```

### 4. Review Process

1. **Code Review** - Al menos 1 aprobación requerida
2. **CI/CD Checks** - Todos los tests deben pasar
3. **Documentation Review** - Verificar documentación
4. **Final Approval** - Merge por maintainer

## 🏷️ Etiquetas de Issues

### Tipos
- `bug` - Error o problema
- `enhancement` - Nueva funcionalidad
- `documentation` - Mejoras en docs
- `good first issue` - Para nuevos contribuidores
- `help wanted` - Necesita ayuda

### Prioridades
- `high` - Crítico, necesita atención inmediata
- `medium` - Importante, pero no urgente
- `low` - Mejora menor o nice-to-have

### Estados
- `open` - Abierto para trabajo
- `in progress` - En desarrollo
- `blocked` - Bloqueado por dependencias
- `closed` - Completado o cerrado

## 🎉 Reconocimiento

### Contribuidores

- **Contribuidores** - Lista en README
- **Hacktoberfest** - Participación anual
- **Badges** - Reconocimiento en perfiles



## 📞 Contacto

### Canales de Comunicación

- **GitHub Issues** - Para problemas y features
- **GitHub Discussions** - Para preguntas generales
- **Discord** - Para chat en tiempo real
- **Email** - Para asuntos privados

### Recursos Adicionales

- **[Guía de Desarrollo](./docs/technical/development.md)**
- **[Estándares de Código](./docs/technical/coding-standards.md)**
- **[Arquitectura](./docs/technical/architecture.md)**
- **[FAQ](./docs/user-guide/faq.md)**

---

**¡Gracias por contribuir al PID Playground! 🎛️**

Tu contribución ayuda a hacer el control automático más accesible para todos.
