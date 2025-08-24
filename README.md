# Simulador PID — Horno/Chiller

Una aplicación web que simula en tiempo real la respuesta térmica de un horno o chiller frente a un setpoint usando un controlador PID ajustable desde la UI.

## Características

- Simulación en tiempo real del modelo FOPDT (First Order Plus Dead Time)
- Controlador PID ajustable con anti-windup
- Interfaz intuitiva con controles deslizantes y métricas en vivo
- Soporte para modo Horno y Chiller
- Gráficas de PV vs SP y salida del controlador
- Presets predefinidos para diferentes tipos de proceso
- Simulación de ruido y disturbios
- SSR por ventana de tiempo
- Exportación de datos en CSV

## Instalación y Uso

### Prerequisitos

- Node.js 18+
- pnpm (gestor preferido del proyecto)

### Instalación

```sh
# Clonar el repositorio
git clone <YOUR_GIT_URL>

# Navegar al directorio del proyecto
cd PID-Simulator

# Instalar dependencias (pnpm)
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

### Scripts disponibles

- `pnpm dev` - Inicia el servidor de desarrollo
- `pnpm build` - Construye la aplicación para producción
- `pnpm preview` - Previsualiza la build de producción
- `pnpm lint` - Ejecuta el linter
- `pnpm test` - Ejecuta la suite de tests
- `pnpm test:coverage` - Ejecuta tests con cobertura

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Gráficas**: Recharts
- **Routing**: React Router DOM

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes de UI base (shadcn/ui)
│   ├── ChartPVSP.tsx   # Gráfica PV vs SP
│   ├── ChartOutput.tsx # Gráfica de salida del PID
│   └── ControlsPanel.tsx # Panel de controles
├── pages/              # Páginas de la aplicación
├── lib/                # Utilidades y tipos
└── hooks/              # Hooks personalizados
```

## Documentación

Ver `docs/brief_funcional_simulador_pid_markdown.md` para especificaciones técnicas detalladas.

## Desarrollo

Este proyecto utiliza:
- Convenciones de código con ESLint
- TypeScript para tipado estático
- Componentes modulares y reutilizables
- Tema oscuro por defecto con estilo industrial
