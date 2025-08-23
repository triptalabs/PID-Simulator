# Propuesta Detallada — Sprint 4: "Features Completas y Polish"

## 1) Resumen ejecutivo
- **Objetivo**: cerrar el producto para Release 1.0.0 garantizando integración completa UI ↔ Worker, ruido reproducible, modo chiller con métricas coherentes, exportación CSV robusta y una suite de tests con alta cobertura.
- **Duración**: 2 semanas (10 días hábiles)
- **Riesgo global**: Medio (features sobre una base técnica sólida)
- **Outcome esperado**: Simulador pedagógico listo para producción, con datos exportables y estabilidad comprobada.


## 2) Objetivos medibles del sprint
- Técnico
  - Cobertura de pruebas ≥80% en lógica crítica (PID, planta, métricas, worker).
  - Ruido con semilla reproducible y conmutación on/off instantánea.
  - Exportación CSV de 10k+ puntos en <5 s en hardware típico.
  - Integración única y coherente entre `SimulationProvider`/`WorkerManager` y el `simulation.worker` real.
- Funcional
  - Modo Horno/Chiller con comportamiento simétrico validado.
  - Métricas (overshoot, tiempo de establecimiento) correctas en pasos ascendentes y descendentes.
  - Selección de ventana de exportación (ventana visible vs historial completo) con metadatos.
- UX
  - Estado de simulación claro y consistente; indicadores de saturación; indicación de modo activo.
  - Acciones de exportación accesibles y comprensibles.


## 3) Alcance del sprint (qué sí y qué no)
- Incluye
  - Consolidación de la integración UI ↔ Worker (un único manager y ruta de worker definitiva).
  - Ruido reproducible con semilla y sigma configurable (aplicado solo a medición; mantener PV limpio disponible).
  - Modo Chiller plenamente funcional (K efectivo negativo y UI/UX clara).
  - Métricas mejoradas para pasos negativos (chiller) y reinicio confiable.
  - Exportación CSV con metadatos completos y opciones de ventana.
  - Suite de pruebas y CI básicos para asegurar calidad y no regresiones.
  - Polish de UI (accesibilidad básica, contraste, estados de saturación, tooltips educativos).
- No incluye
  - Persistencia local de configuración e import/export de presets (post-1.0 si no hay tiempo).
  - Métricas integrales avanzadas (IAE/ISE/RMSE) más allá del MVP si compromete tiempos.


## 4) Historias del sprint y criterios de aceptación (conceptual)

### H2.3 — Anti-windup Back-calculation (consolidación y verificación)
- Enfoque: Validar el comportamiento anti-windup bajo saturaciones prolongadas, comparar vs escenario sin anti-windup y ajustar parámetros de seguimiento cuando corresponda.
- Aceptación
  - Reducción de overshoot >50% respecto a escenario sin anti-windup en un caso de saturación prolongada.
  - Recuperación suave al salir de saturación (sin rebote excesivo). 
  - Comportamiento correcto en saturaciones por arriba (u=1) y por abajo (u=0).
  - Exposición en UI de estado de saturación y efecto observable en variables.

### H1.3 — Modo Chiller (completo)
- Enfoque: Usar ganancia efectiva negativa con comportamiento simétrico a horno; UI indica modo activo; presets coherentes.
- Aceptación
  - Incrementar la salida u en chiller provoca descenso de PV (dirección invertida) de forma consistente.
  - Métricas (overshoot, ts) se calculan correctamente para escalones descendentes.
  - UI indica modo activo con iconos/colores y texto; preset “chiller compacto” coherente.

### H1.4 — Ruido de medición (reproducible)
- Enfoque: Generación de ruido gaussiano con semilla fija, aplicado únicamente a la medición (no al estado interno), con control en UI.
- Aceptación
  - Con la misma semilla y parámetros, las series de PV ruidoso son reproducibles.
  - Conmutación on/off es instantánea; sigma ajustable.
  - Disponibilidad simultánea de `PV` (con ruido) y `PV_clean` (sin ruido) para gráficos/exportación.

### H5.1 — Exportar CSV (robusto)
- Enfoque: Exportar datos con columnas mínimas t, SP, PV, u, PV_clean más metadatos (parámetros PID, planta, modo, Ts, tamaño de ventana, timestamp de exportación).
- Aceptación
  - Usuario elige "Ventana actual" o "Todo el historial" y ve el número de puntos estimado.
  - Archivo compatible con Excel/MATLAB (separador estandarizado, encabezados claros).
  - Exportación <5 s para 10k puntos en hardware típico.

### H7.1 — Suite de tests unitarios y de integración (≥80% core)
- Enfoque: Pruebas exhaustivas del núcleo (PID, planta, métricas, ruido) y de integración básica Worker ↔ UI.
- Aceptación
  - Cobertura ≥80% en archivos críticos.
  - Tiempo total de pruebas <30 s en entorno local típico.
  - Casos borde incluidos (parámetros extremos, saturación, pasos descendentes).


## 5) Cambios de arquitectura e integración (conceptual)
- Unificar la integración a través de `SimulationProvider` + `WorkerManager` centralizado.
  - Evitar instanciaciones ad-hoc del manager en `Dashboard` u otros componentes.
  - Asegurar que `WorkerManager` apunte al worker definitivo (simulación real) y use el contrato esperado (mensajes de inicio/configuración/estado).
- Mantener un único buffer de datos para charts/exportación.
- Mantener el contrato de eventos: `READY`, `STATE`, `TICK`, `METRICS`, `ERROR` con la semántica documentada.
- Validar que los mensajes de configuración (`SET_PID`, `SET_PLANT`, `SET_SP`, `SET_NOISE`) se apliquen sincrónicamente y con feedback en UI.


## 6) Diseño funcional del ruido con semilla (conceptual)
- Semilla
  - Permitir establecer una semilla numérica; si no se especifica, generar una por defecto y exponerla (para reproducibilidad futura).
- Generación
  - Generador determinista de números pseudoaleatorios + transformación a normal (Box-Muller). 
  - Re-inicialización del generador al cambiar la semilla.
- Aplicación
  - Ruido solo en medición (PV), sin afectar estado interno ni estabilidad.
  - Campo `PV_clean` disponible para gráficos y export.
- UX
  - Controles: switch on/off y slider de sigma; opcionalmente un campo de semilla (avanzado).
  - Indicaciones breves sobre el impacto del ruido y cómo la derivada filtrada mitiga su efecto.


## 7) Métricas en paso ascendente y descendente (conceptual)
- Overshoot
  - Definirlo de forma coherente para escalones descendentes: usar referencia con signo y mantener la interpretación pedagógica.
  - Mantener registro de pico (valor y tiempo) con dirección adecuada.
- Tiempo de establecimiento (±2% por defecto)
  - Confirmar cómputo con banda de tolerancia respecto al nuevo setpoint en ambos sentidos.
  - Respetar ventana de hold (p. ej., 2–5 s) y reinicios si se sale de banda.
- Reinicio automático de métricas
  - Con cambios significativos de SP, resetear métricas y comunicar estado "calculando".
  - Señalización en UI del estado de cálculo y muestra de contadores (muestras, tiempo transcurrido).


## 8) Exportación CSV (conceptual)
- Datos mínimos por fila: tiempo, setpoint, PV (con ruido), salida de control, PV limpio.
- Metadatos en encabezado o bloque inicial: versión, fecha/hora, parámetros PID (kp, ki, kd, N, Tt), parámetros de planta (K, τ, L, T_amb, modo), `Ts`, tamaño de buffer y ventana usada.
- Opciones de rango: ventana visible vs historial completo; indicar cuántos puntos se exportarán antes de confirmar.
- Rendimiento: procesar en memoria de forma eficiente; para >10k puntos, proporcionar un indicador simple de progreso.
- Formato: separador estándar y decimales unificados; documentar compatibilidad y posibles ajustes de locale del usuario.


## 9) UX y polish
- Estado de saturación de salida (u) visible en UI con badges/colores.
- Indicación clara de modo activo (Horno/Chiller) en controles y/o encabezados.
- Tooltips educativos breves para anti-windup, derivada filtrada y ruido.
- Revisión de contraste en tema oscuro, foco de elementos y accesibilidad básica.


## 10) Plan de pruebas (conceptual)
- Unit
  - PID: proporcional/integral/derivativo filtrado; anti-windup bajo saturación; estabilidad numérica.
  - Planta FOPDT: discretización exacta, tiempo muerto, modo chiller (K efectivo negativo), validación de límites.
  - Métricas: overshoot (ambas direcciones), tiempos de establecimiento, reinicios automáticos, casos borde con SP=0.
  - Ruido: reproducibilidad con semilla, sigma variable, no impacto en estado interno.
- Integración
  - Flujo UI → Worker: comandos de seteo aplican cambios observables en `TICK` y `METRICS`.
  - Flujo Worker → UI: eventos respetan frecuencias y semántica; errores de configuración generan avisos no bloqueantes.
- Performance y estabilidad
  - Mantener 10 Hz promedio (±0.1 Hz) sin drift apreciable en sesiones largas.
  - Memoria de buffer estable (política de recorte/ventana).


## 11) CI/CD (conceptual)
- Pipeline básico con instalación de dependencias, ejecución de pruebas y build de producción.
- Reglas mínimas: bloquear merge si pruebas fallan o build falla.
- Reporte de cobertura y registro de duración de pruebas.


## 12) Riesgos y mitigaciones
- Anti-windup requiere fine-tuning en ciertos presets
  - Mitigación: validar temprano con escalones extremos; exponer Tt (o heurística) si hace falta para ajustes finos.
- Exportar grandes volúmenes en equipos lentos
  - Mitigación: opción por defecto "Ventana actual" + indicador de progreso y aviso del número de puntos.
- Inconsistencias UI ↔ Worker por dobles fuentes de estado
  - Mitigación: unificar el manager en `SimulationProvider` y retirar instancias paralelas.


## 13) Plan de trabajo (cronograma sugerido 10 días)
1. Integración única UI ↔ Worker; ruta de worker definitiva; validaciones de contrato. (Día 1)
2. Ruido reproductible (semilla), conmutación instantánea, mantener `PV_clean`. (Día 2)
3. Modo chiller + métricas bidireccionales (overshoot/settling) y señales en UI. (Día 3)
4. Exportación CSV: datos, metadatos, opciones de ventana, compatibilidad. (Días 4–5)
5. Suite de pruebas (unit + integración) y baseline de CI. (Días 6–7)
6. Polish de UI/accesibilidad y microcopys educativos. (Día 8)
7. Pruebas manuales guiadas, fixes finales, documentación y preparación de release. (Días 9–10)


## 14) Definition of Done (Sprint)
- Funcionalidades implementadas y verificadas conforme a criterios de aceptación.
- Integración única UI ↔ Worker sin duplicidades, con contratos respetados.
- Cobertura ≥80% en núcleo; pruebas <30 s en entorno local típico.
- Exportación CSV validada en Excel/MATLAB.
- Accesibilidad básica revisada; UI con estados y mensajes claros.
- Documentación y notas de release actualizadas.


## 15) Criterios de aceptación del sprint (resumen ejecutivo)
- Anti-windup efectivo bajo saturación, con overshoot reducido.
- Modo chiller simétrico, métricas correctas en pasos descendentes.
- Ruido reproducible con semilla, sigma ajustable, conmutación instantánea.
- CSV exporta datos y metadatos, con selección de ventana y rendimiento adecuado.
- Pruebas y build verdes en CI; cobertura objetivo alcanzada.


## 16) Métricas de éxito a monitorear
- Técnicas: frecuencia efectiva de simulación, estabilidad temporal, memoria del buffer, cobertura y duración de pruebas.
- Funcionales: corrección de overshoot/settling vs expectativas, tiempo de exportación, compatibilidad de archivo.
- UX: claridad de estados, percepción de inmediatez de controles (<100 ms), ausencia de bloqueos en UI.


## 17) Entregables
- Integración unificada y estable de simulación.
- Ruido con semilla, UI operativa de ruido.
- Modo chiller con UX clara y métricas correctas.
- Exportación CSV con metadatos y opciones de ventana.
- Suite de pruebas y pipeline de CI funcionando.
- Documentación actualizada y Release 1.0.0 listo.


## 18) Supuestos y dependencias
- La base del modelo FOPDT y del PID se mantiene estable (ya validada en sprints previos).
- No hay cambios sustantivos de alcance más allá de lo descrito.
- Disponibilidad de tiempo para validación manual y ajuste fino en los últimos 2 días.


## 19) Notas para la Review y Demo
- Preparar un guion de demo con: cambio de SP ascendente/descendente, activación de chiller, activación de ruido (con semilla), demostración de overshoot/ts y exportación CSV (ventana/historial). 
- Mostrar cobertura de pruebas y pipeline verde. 
- Solicitar feedback de UX y de metadatos del CSV.


