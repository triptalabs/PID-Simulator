## Issues consolidados (5) derivados de la auditoría (2025-08-23)

### 1) Integración UI ↔ Worker unificada (Alta)
- Descripción: Unificar todos los cambios de `ControlsPanel` y Acciones con comandos reales al Worker. Incluir setpoint, `pid.*`, `plant.*`, `noise.*`, `ssr.*`, presets y botones `start/pause/reset` (con `preserveParams` cuando aplique).
- Criterio de aceptación:
  - Cambios en UI generan `SET_SP`/`SET_PID`/`SET_PLANT`/`SET_NOISE` y se reflejan en `TICK`/`STATE`/`METRICS`.
  - Botones y atajos S/R mapean a `start/pause/reset` y cambian estados de UI según `workerState`.
  - Presets envían parámetros al Worker con feedback visible.
  - Ruido y SSR tienen efecto real o se ocultan si no están soportados.

### 2) Datos en tiempo real sin mocks + métricas coherentes (Alta)
- Descripción: Eliminar `generateMockData`/`calculateMetrics` y cualquier `useEffect` que pise `chartData`. Usar exclusivamente datos de `onTick`/`onMetrics`. Asegurar telemetría (`avg_cycle_time`, `cpu_usage_estimate`) estable y thresholds de warning.
- Criterio de aceptación:
  - Gráficas PV/SP y salida PID consumen solo buffer/`onTick` reales.
  - Métricas (overshoot, settling time) provienen del Worker y son consistentes tras >10 min.

### 3) Carga del Worker y configuración por entorno (Media)
- Descripción: Normalizar la creación del Worker para dev/prod (`new Worker(new URL('../workers/simulation.worker.ts', import.meta.url), { type: 'module' })`) y/o respetar `config.workerPath`. Parametrizar `debugMode` por entorno y validar `pnpm preview` con Worker real.
- Criterio de aceptación:
  - Dev y build prod cargan el mismo Worker de simulación (no test/simple).
  - `debugMode` solo en dev; consola limpia en prod.
  - `pnpm preview` sirve build funcional con Worker operativo.

### 4) Recuperación de suite de tests + contrato Worker (Media)
- Descripción: Arreglar entorno Vitest (jsdom/setup, PATH en Windows), actualizar scripts y añadir pruebas de contrato (INIT/START/PAUSE/RESET, `SET_*`, y verificación de `TICK`/`STATE`/`METRICS`).
- Criterio de aceptación:
  - `pnpm test` pasa localmente.
  - Cobertura mínima sobre WorkerManager y componentes críticos.

### 5) UX/Docs y limpieza visual (Baja)
- Descripción: Ocultar "UI Mock" en producción, mejorar UX de `Reset` (confirmación y estado), y actualizar `docs/02-architecture-and-contract.md` con el flujo UI ↔ Worker real.
- Criterio de aceptación:
  - Build de producción sin "UI Mock".
  - Reset claro, con opción `preserveParams` y feedback.
  - Documentación alineada con la implementación.


