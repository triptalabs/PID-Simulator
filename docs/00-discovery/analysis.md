# Análisis Técnico - Simulador PID Horno/Chiller

## 1. Resumen Ejecutivo

Este documento presenta el análisis técnico completo del proyecto **Simulador PID Horno/Chiller**, una aplicación web SPA que simula el comportamiento térmico de sistemas de calentamiento y enfriamiento usando control PID en tiempo real.

## 2. Requisitos Funcionales Extraídos

### 2.1 Interfaz de Usuario (Dashboard único)
- **Tema oscuro** por defecto con diseño accesible
- **Layout A**: Controles a la izquierda, métricas + gráficas a la derecha
- **Panel izquierdo de controles**:
  - Modo: Horno / Chiller (switch)
  - Setpoint: slider + input numérico sincronizados (0-200°C)
  - Ganancias PID: Kp (0-10), Ki (0-1 s⁻¹), Kd (0-200 s)
  - Planta (acordeón avanzado): K (-0.10 a 0.10), τ (1-600 s), L (0-15 s), T_amb (10-35°C)
  - Ruido/Disturbios: switch + intensidad, botón "Paso de carga"
  - Presets: Horno lento/medio, Chiller compacto
  - SSR por ventana (opcional): período 0.5-10 s
  - Acciones: Iniciar/Pausar, Reset, Exportar CSV
- **Panel derecho de visualización**:
  - Métricas: Overshoot %, tₛ (±2%)
  - Gráfica PV vs SP
  - Gráfica Salida PID (%)
  - Selector ventana temporal: 30/60/300 s

### 2.2 Simulación Física
- **Modelo FOPDT** (First Order Plus Dead Time)
- **Ecuación**: `dx/dt = -x/τ + K·u(t-L) + d(t)`, donde `x = T - T_amb`
- **Discretización exacta** preferida: `x_{k+1} = a·x_k + b·u_{k-L_s} + b_d·d_k`
- **Tiempo muerto**: Buffer FIFO para `u` con longitud `L_s = ceil(L/T_s)`
- **Modo Chiller**: `K < 0` con `u ∈ [0,1]` (recomendado)
- **Ruido gaussiano**: `PV_k = y_k + n_k`, `n_k ~ N(0,σ²)`

### 2.3 Control PID
- **Forma posicional** con anti-windup back-calculation
- **Error**: `e_k = SP_k - PV_k`
- **Integral**: `I_k = I_{k-1} + K_i·T_s·e_k + (T_s/T_t)·(u_k - u_k^{raw})`
- **Derivada filtrada** sobre la medida con factor N≈10
- **Saturación**: `u ∈ [0,1]` para ambos modos
- **Unidades**: Kp adimensional, Ki [s⁻¹], Kd [s]

### 2.4 Métricas de Desempeño
- **Overshoot**: `max(0, (T_max - SP)/SP) × 100`
- **Tiempo de establecimiento** (tₛ): primer instante que PV entra en banda ±2% y permanece por tiempo de hold (5s)
- **Reinicio automático**: tras Reset, cambio de SP significativo, o aplicar presets

### 2.5 Funcionalidades Avanzadas
- **SSR por ventana**: potencia media equivalente (no toggling duro)
- **Disturbio escalón**: amplitud y duración configurables
- **Presets integrados** con valores validados
- **Exportación CSV**: ventana visible o corrida completa
- **Persistencia local**: localStorage para últimos valores

## 3. Requisitos No Funcionales

### 3.1 Rendimiento
- **Simulación**: 10 Hz (T_s = 100 ms) sin drift temporal
- **UI rendering**: ~60 FPS con requestAnimationFrame
- **Latencia**: controles responsive sin bloqueos
- **Memoria**: buffers circulares eficientes para historial

### 3.2 Estabilidad Numérica
- **Discretización estable** para cualquier T_s > 0
- **Protección contra NaN/Inf**: validación de entradas
- **Clamps estrictos**: todos los parámetros dentro de rangos seguros
- **Anti-windup robusto**: evitar saturación prolongada

### 3.3 Usabilidad
- **Idioma**: Español
- **Accesibilidad**: labels, tooltips, foco visible
- **Controles sincronizados**: sliders ↔ inputs numéricos
- **Feedback visual**: estado de simulación claro

## 4. Mapeo UI → Estados → Mensajes Worker

### 4.1 Estados de la Aplicación
```typescript
enum SimulationState {
  STOPPED = 'stopped',
  RUNNING = 'running', 
  PAUSED = 'paused',
  ERROR = 'error'
}

interface UIState {
  // Control de simulación
  simulationState: SimulationState
  
  // Parámetros de control
  mode: 'horno' | 'chiller'
  setpoint: number // °C
  pidGains: { kp: number, ki: number, kd: number }
  
  // Parámetros de planta
  plantParams: { K: number, tau: number, L: number, T_amb: number }
  
  // Configuración
  noiseConfig: { enabled: boolean, sigma: number }
  ssrConfig: { enabled: boolean, period: number }
  timeWindow: 30 | 60 | 300 // segundos
  
  // Estado de datos
  currentData: { t: number, SP: number, PV: number, u: number }
  metrics: { overshoot: number, ts: number }
  history: DataPoint[]
}
```

### 4.2 Contrato de Mensajes (Propuesta)

#### Mensajes UI → Worker
| Tipo | Payload | Frecuencia | Idempotente |
|------|---------|------------|-------------|
| `INIT` | `{ timestep: number }` | Una vez | Sí |
| `START` | `{}` | On-demand | Sí |
| `PAUSE` | `{}` | On-demand | Sí |
| `RESET` | `{}` | On-demand | No |
| `SET_PID` | `{ kp, ki, kd, N?, Tt? }` | On-change | Sí |
| `SET_PLANT` | `{ K, tau, L, T_amb }` | On-change | Sí |
| `SET_SP` | `{ value }` | On-change | Sí |
| `SET_NOISE` | `{ sigma, enabled }` | On-change | Sí |
| `ADD_DISTURBANCE` | `{ amplitude, duration }` | On-demand | No |
| `SET_SSR` | `{ enabled, period }` | On-change | Sí |
| `SET_WINDOW` | `{ seconds }` | On-change | Sí |
| `APPLY_PRESET` | `{ key, resetScenario? }` | On-demand | No |

#### Mensajes Worker → UI
| Tipo | Payload | Frecuencia | Descripción |
|------|---------|------------|-------------|
| `TICK` | `{ t, SP, PV, u, bounds }` | 10 Hz | Datos de simulación |
| `METRICS` | `{ overshoot, ts, valid }` | Variable | Métricas calculadas |
| `STATE` | `{ state, timestamp }` | On-change | Estado de simulación |
| `ERROR` | `{ code, message, details }` | On-error | Errores y warnings |

## 5. Decisiones Técnicas Clave

### 5.1 Discretización Exacta vs Euler
**Decisión**: Usar discretización exacta por defecto
**Justificación**:
- Mayor estabilidad numérica para cualquier T_s
- Evita errores de acumulación en simulaciones largas
- Coincidencia exacta con solución analítica (L=0)

### 5.2 Derivada Filtrada y Anti-windup
**Decisión**: Derivada sobre la medida con filtro de 1er orden, anti-windup por back-calculation
**Justificación**:
- Reduce ruido en la salida de control
- Back-calculation más suave que clamps duros
- Parámetros N=10, Tt calculado dinámicamente

### 5.3 Arquitectura Worker
**Decisión**: Web Worker dedicado con reloj de alta precisión
**Justificación**:
- No bloquea el hilo principal de UI
- Consistencia temporal con performance.now()
- Escalabilidad para múltiples escenarios futuros

## 6. Riesgos Técnicos Identificados

### 6.1 Aliasing Temporal
**Riesgo**: Frecuencias de muestreo inadecuadas pueden causar aliasing
**Mitigación**: T_s fijo a 100ms, validación de parámetros L vs T_s

### 6.2 Drift de Reloj
**Riesgo**: Acumulación de errores temporales en simulaciones largas
**Mitigación**: Reloj monotónico con corrección de drift acumulativo

### 6.3 Saturación Prolongada
**Riesgo**: Integrador puede causar comportamiento errático
**Mitigación**: Anti-windup robusto con tracking time adaptativo

### 6.4 Oscilaciones por Ki
**Riesgo**: Ganancia integral alta puede inducir inestabilidad
**Mitigación**: Límites conservadores, validación de estabilidad

### 6.5 Sensibilidad del Derivativo
**Riesgo**: Ruido amplificado en salida de control
**Mitigación**: Filtro de derivada con N configurable, derivada sobre PV

### 6.6 Memoria de Buffers
**Riesgo**: Buffers de historial pueden crecer indefinidamente
**Mitigación**: Buffers circulares con límites estrictos, garbage collection

## 7. KPIs y Pruebas Numéricas

### 7.1 Casos de Validación
1. **Caso analítico (L=0)**: Comparación con solución exacta
2. **Step test**: Overshoot y ts para cada preset
3. **Disturbio**: Rechazo y recuperación controlada
4. **Ruido**: Estabilidad con σ variable
5. **Tiempo muerto**: Verificación de retardo L

### 7.2 Oráculos Esperados
- **Precisión temporal**: |t_simulado - t_teórico| < 0.5·T_s
- **Convergencia**: Error estado estacionario < 1% para escalón
- **Estabilidad**: No oscilaciones sostenidas con parámetros válidos
- **Métricas**: Overshoot ±5% del esperado teórico

## 8. Convenciones y Estándares

### 8.1 Estructura de Código
```
src/
  workers/
    simulation.worker.ts    # Worker principal
    pid-controller.ts       # Lógica PID
    plant-model.ts         # Modelo FOPDT
  lib/
    simulation-types.ts    # Tipos e interfaces
    message-contracts.ts   # Contratos de mensajes
  components/
    SimulationProvider.tsx # Context provider
```

### 8.2 Naming Conventions
- **Archivos**: kebab-case
- **Componentes**: PascalCase
- **Funciones/variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Tipos**: PascalCase con sufijo Type/Interface

### 8.3 Commits y Versionado
- **Conventional Commits**: feat/fix/docs/style/refactor/test/chore
- **SemVer**: MAJOR.MINOR.PATCH
- **Ramas**: feature/*, bugfix/*, release/*

## 9. Preguntas Abiertas para Resolución

1. **Tamaño de buffers**: ¿Cuántos datos conservar para export (memoria vs funcionalidad)?
2. **Estrategia t_hold**: ¿5s fijos o proporcional a τ?
3. **Límites de integrador**: ¿Clamps absolutos o relativos a rango de salida?
4. **Downsampling**: ¿Política de reducción para ventanas largas?
5. **Persistencia**: ¿Qué configuraciones guardar en localStorage?
6. **Tolerancia de ruido**: ¿Límites automáticos de σ según rango de SP?

## 10. Conclusiones

El proyecto presenta un **alcance bien definido** con requisitos claros tanto funcionales como no funcionales. La **complejidad técnica es moderada** pero requiere atención especial en:

- **Estabilidad numérica** de la simulación
- **Arquitectura de comunicación** UI-Worker eficiente  
- **Cálculo robusto de métricas** en tiempo real
- **Gestión de memoria** para simulaciones largas

La implementación será **iterativa** siguiendo metodología SCRUM con énfasis en **validación numérica continua** y **pruebas de integración** entre componentes.
