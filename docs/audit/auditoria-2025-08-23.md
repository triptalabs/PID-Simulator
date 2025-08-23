## Auditoría funcional y técnica de PID-Simulator (2025-08-23)

### Resumen ejecutivo
- **Resultado general**: Aplicación operativa en desarrollo; simulación y UI responden correctamente; flujo Worker ↔ UI activo; auditoría E2E con navegador automatizado OK.
- **Hallazgos clave**:
  - **Tests unitarios**: Vitest falla en este entorno (Windows) sin logs detallados; no bloquea la app.
  - **Desacople parcial UI ↔ Worker**: Controles de `ControlsPanel` actualizan solo estado local; no envían comandos al Worker (ver recomendaciones).
  - **Mock data**: Existen generadores de datos mock en `Dashboard` que pueden interferir con datos reales del Worker.
  - **Detalle menor**: Etiqueta "UI Mock" visible en el header.

---

### Entorno y setup
- **SO**: Windows 10 (win32 10.0.19045)
- **Gestor**: pnpm (preferido del proyecto)
- **Instalación**: `pnpm install --no-frozen-lockfile`
- **Dev server**: `pnpm dev` → Vite en `http://localhost:8080`
- **Navegación E2E**: Playwright MCP sobre `http://localhost:8080`

---

### Cobertura de pruebas manuales asistidas (E2E)
- **Estado de Simulación (tarjeta)**
  - Badges: Worker: Desconectado → Conectado, Simulación: Inicializando → Listo/ Ejecutándose/ Pausado.
  - Botones: Iniciar, Pausar, Reset con estados habilitado/disabled correctos según conexión/ejecución.
  - Datos en vivo: Tiempo, SP, PV, Salida se muestran cuando hay ticks.
- **Controles**
  - Modo: Tabs "Horno/Chiller" visibles y funcionales a nivel UI.
  - Setpoint: Slider + input numérico sincronizados (debounce 50ms).
  - PID: Sliders Kp/Ki/Kd con input sincronizado y clamping.
  - Planta (acordeón): Parámetros K/τ/L/T_amb con slider+input.
  - Ruido y disturbios: Switch "Ruido" visible; botón "Paso de carga" placeholder con toast.
  - SSR: Switch de ventana SSR visible.
  - Presets: Combobox + botón Aplicar (habilita al seleccionar).
  - Acciones (panel inferior): Iniciar/Pausar (toggle local), Reset (placeholder en UI).
- **Métricas y gráficas**
  - Panel de métricas: Estado (Calculando/Activo), overshoot, t_peak, settling_time; contador de muestras.
  - Gráficas: PV vs SP y salida PID actualizan con el tiempo.
- **Atajos**
  - Definidos en `Dashboard` para S (toggle run) y R (reset) — no validados en esta sesión.

---

### Observaciones de logs y Worker
- Al cargar: `READY`, `STATE`, `TICK`, `METRICS` en consola, frecuencia ≈ 10 Hz (Ts=0.1s).
- Mensajes de telemetría coherentes: `samples_processed`, `avg_cycle_time`, `cpu_usage_estimate` aumentan/varían.
- Evidencia de inicialización del `simulation.worker.ts` con `debugMode: true`.

---

### Incidencias detectadas
- **Vitest falla en CI/local**
  - Síntoma: `ELIFECYCLE Test failed` (previo: "programa o archivo por lotes ejecutable")
  - Impacto: Sin cobertura automática de tests; no afecta la ejecución dev ni E2E.
  - Posibles causas: PATH/Node bin en Windows, configuración `test` (jsdom), dependencias recientes.
- **Controles de `ControlsPanel` no envían comandos al Worker**
  - Hoy actualizan solo `SimulatorState` local; el Worker permanece con defaults salvo lo que se modifique explícitamente desde código.
  - Impacto: UI puede mostrar cambios que no afectan la simulación real; riesgo de inconsistencia.
- **Datos mock en `Dashboard`**
  - `generateMockData` y `calculateMetrics` rehacen `chartData` ante cambios de estado, pudiendo mezclar datos reales (onTick) y mock.
  - Impacto: Métricas/plots podrían no representar exactamente la simulación real.
- **Detalle menor UI**: Texto "UI Mock" en header visible en runtime.

---

### Recomendaciones
- **Unificar Control UI ↔ Worker (alta prioridad)**
  - En `Dashboard` → `handleStateChange`: según la clave cambiada, invocar `WorkerManager` correspondiente:
    - `setpoint` → `worker.setSetpoint(value)`
    - `pid.*` → `worker.setPID({ kp, ki, kd, ... })`
    - `plant.*` → `worker.setPlant({ K, tau, L, T_amb, mode })`
    - `noise.*`/`enabled` → `worker.setNoise(enabled, sigma, seed)`
    - `ssr.*` → (si aplica) comando o manejo local consistente
  - Acciones: mapear botones Acciones a `start() / pause() / reset()` del `WorkerManager`.
- **Eliminar mocks en producción**
  - Retirar `generateMockData`/`calculateMetrics` y la `useEffect` que pisa `chartData`; conservar únicamente los datos provenientes de `onTick`.
- **Alinear carga de Worker**
  - Estándar Vite: `new Worker(new URL('../workers/simulation.worker.ts', import.meta.url), { type: 'module' })` y usar `config.workerPath` cuando se provea.
- **Tests (recuperación)**
  - Asegurar `vitest`, `jsdom`, setupTests; ejecutar `pnpm test` en shell con PATH correcto.
  - Añadir pruebas de contrato Worker (INIT/START/PAUSE/RESET) y métricas básicas.
- **UX**
  - Ocultar "UI Mock" en producción.
  - Confirmaciones/estados al aplicar Presets y Reset real del Worker.

---

### Pasos ejecutados (traza)
1) Instalación: `pnpm install --no-frozen-lockfile`
2) Dev: `pnpm dev` → `http://localhost:8080`
3) Navegación automatizada → verificación de consola y estado (READY/STATE/TICK/METRICS)
4) Interacciones: Iniciar, Pausar, re-Iniciar; abrir "Ruido y disturbios"; ver SSR/Presets/UI; verificar métricas y charts.
5) Intento de tests: `pnpm test` → falla (ver Incidencias).

---

### Conclusión
- **Funcionalidad de los sprints** (Worker independiente, FOPDT, PID con derivada filtrada y anti-windup, métricas y UI básica) se observa operativa en desarrollo.
- Para cerrar ciclo: alinear controles UI con comandos del Worker y retirar mocks, luego recuperar la suite de tests.


