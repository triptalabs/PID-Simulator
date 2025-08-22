# Roadmap SCRUM - Épicas, Historias y Planificación

## 1. Épicas del Producto

### E1 - Planta y Física Térmica
**Descripción**: Implementación del modelo matemático FOPDT (First Order Plus Dead Time) con discretización exacta y manejo robusto de parámetros físicos.

**Valor de negocio**: Base fundamental para simulaciones precisas y educación técnica.

**Criterios de aceptación épica**:
- Modelo FOPDT discreto estable para todos los rangos válidos
- Tiempo muerto implementado con buffer FIFO preciso
- Modo Chiller funcionando con K negativo
- Validación contra soluciones analíticas (error < 1%)

---

### E2 - Controlador PID y Anti-windup  
**Descripción**: Implementación de controlador PID posicional con derivada filtrada sobre la medida y anti-windup por back-calculation.

**Valor de negocio**: Core del simulador, debe replicar exactamente el comportamiento de controladores reales.

**Criterios de aceptación épica**:
- PID posicional con ganancias en unidades estándar
- Derivada filtrada con factor N configurable
- Anti-windup back-calculation funcionando
- Saturación de salida a [0,1] sin oscilaciones

---

### E3 - Web Worker y Reloj de Simulación
**Descripción**: Arquitectura de simulación en tiempo real usando Web Worker con reloj preciso y comunicación eficiente.

**Valor de negocio**: Garantiza performance de UI fluida y simulación estable.

**Criterios de aceptación épica**:
- Simulación a 10 Hz estable por 8+ horas
- Worker independiente sin bloquear UI
- Comunicación tipada UI ↔ Worker
- Drift temporal < 0.1% después de 1 hora

---

### E4 - Métricas y Análisis de Desempeño
**Descripción**: Cálculo automático de métricas clave de control (Overshoot, tiempo de establecimiento) con visualización en tiempo real.

**Valor de negocio**: Componente educativo diferenciador que enseña conceptos de control.

**Criterios de aceptación épica**:
- Overshoot % calculado correctamente tras cambios de SP
- Tiempo de establecimiento ±2% con hold time
- Reinicio automático de métricas en eventos relevantes
- Métricas opcionales IAE/ISE/RMSE implementadas

---

### E5 - Exportación y Persistencia
**Descripción**: Capacidades de exportación de datos en CSV y persistencia local de configuraciones.

**Valor de negocio**: Facilita análisis posterior y productividad del usuario.

**Criterios de aceptación épica**:
- Exportación CSV con formato estándar
- Persistencia en localStorage de configuraciones
- Exportación de ventana visible o corrida completa
- Capacidad de importar configuraciones

---

### E6 - Integración UI y Experiencia de Usuario
**Descripción**: Integración completa de todos los componentes con la UI existente y optimización de UX.

**Valor de negocio**: Usabilidad y adopción del producto final.

**Criterios de aceptación épica**:
- Todos los controles de UI funcionales
- Sincronización sliders ↔ inputs numéricos
- Feedback visual inmediato
- Tema oscuro completo y accesible

---

### E7 - QA, Testing y Validación
**Descripción**: Suite completa de pruebas unitarias, de integración y validación numérica.

**Valor de negocio**: Confiabilidad y mantenibilidad del producto.

**Criterios de aceptación épica**:
- Cobertura de tests >= 80% para lógica crítica
- Pruebas de validación numérica automatizadas
- Tests de performance y estabilidad
- Documentación de casos de prueba

---

## 2. Historias de Usuario por Épica

### E1 - Planta y Física Térmica

#### H1.1 - Modelo FOPDT Básico
**Como** ingeniero estudiando control térmico  
**Quiero** simular un sistema de primer orden con tiempo muerto  
**Para** entender el comportamiento dinámico de procesos térmicos reales

**Criterios de aceptación**:
- **Dado** parámetros válidos K, τ, L, T_amb
- **Cuando** aplico un escalón en la entrada u
- **Entonces** la respuesta debe seguir la ecuación FOPDT exacta
- **Y** el tiempo muerto debe ser exactamente L segundos
- **Y** la ganancia estática debe ser τ·K

#### H1.2 - Discretización Exacta
**Como** desarrollador del simulador  
**Quiero** usar discretización matemáticamente exacta  
**Para** garantizar estabilidad numérica en simulaciones largas

**Criterios de aceptación**:
- **Dado** cualquier T_s > 0 válido
- **Cuando** ejecuto simulación por 1+ horas
- **Entonces** no debe haber drift numérico apreciable
- **Y** la respuesta debe coincidir con solución analítica (L=0)
- **Y** debe ser estable independiente del valor de T_s

#### H1.3 - Modo Chiller
**Como** usuario simulando un sistema de enfriamiento  
**Quiero** activar modo Chiller  
**Para** simular procesos donde mayor control significa menor temperatura

**Criterios de aceptación**:
- **Dado** modo Chiller activado  
- **Cuando** incremento la salida de control u
- **Entonces** la temperatura debe decrecer (K < 0)
- **Y** el comportamiento debe ser simétrico al modo Horno
- **Y** la UI debe indicar claramente el modo activo

#### H1.4 - Ruido de Medición
**Como** usuario practicando control con ruido  
**Quiero** agregar ruido gaussiano a la medición  
**Para** simular condiciones reales de medición

**Criterios de aceptación**:
- **Dado** ruido habilitado con σ > 0
- **Cuando** ejecuto la simulación
- **Entonces** PV debe tener ruido gaussiano con desviación σ
- **Y** el ruido no debe afectar el estado interno de la planta
- **Y** debo poder desactivar el ruido instantáneamente

---

### E2 - Controlador PID y Anti-windup

#### H2.1 - PID Posicional Básico
**Como** estudiante de control automático  
**Quiero** ajustar ganancias Kp, Ki, Kd en tiempo real  
**Para** ver inmediatamente el efecto en la respuesta del sistema

**Criterios de aceptación**:
- **Dado** ganancias PID válidas
- **Cuando** cambio cualquier ganancia con slider o input
- **Entonces** el controlador debe aplicar el cambio inmediatamente
- **Y** la respuesta debe cambiar visiblemente en <100ms
- **Y** las unidades deben ser estándar (Kp adimensional, Ki s⁻¹, Kd s)

#### H2.2 - Derivada Filtrada
**Como** ingeniero sintonizando controladores  
**Quiero** derivada filtrada para reducir ruido  
**Para** evitar salidas de control erráticas con ruido de medición

**Criterios de aceptación**:
- **Dado** Kd > 0 y ruido habilitado
- **Cuando** hay ruido en la medición PV  
- **Entonces** la salida de control no debe oscilar excesivamente
- **Y** el filtro debe usar factor N configurable
- **Y** la derivada debe calcularse sobre PV, no sobre error

#### H2.3 - Anti-windup Back-calculation
**Como** usuario con SP muy alto  
**Quiero** que el integrador no se sature  
**Para** evitar overshoot excesivo cuando el SP sea alcanzable

**Criterios de aceptación**:
- **Dado** un SP que causa saturación prolongada de u
- **Cuando** la salida se satura en u=1 por tiempo prolongado
- **Entonces** el integrador debe dejar de acumular (anti-windup)
- **Y** cuando la saturación termine, la recuperación debe ser suave
- **Y** no debe haber overshoot excesivo al alcanzar el SP

#### H2.4 - Límites y Saturación
**Como** usuario del simulador  
**Quiero** que la salida de control esté limitada a [0,1]  
**Para** simular limitaciones reales de actuadores

**Criterios de aceptación**:
- **Dado** cualquier condición de operación
- **Cuando** el PID calcula una salida
- **Entonces** u debe estar siempre en rango [0,1]
- **Y** debe indicarse visualmente cuando u esté saturado
- **Y** la saturación debe activar el anti-windup

---

### E3 - Web Worker y Reloj de Simulación

#### H3.1 - Worker de Simulación
**Como** usuario de la aplicación  
**Quiero** que la simulación no bloquee la interfaz  
**Para** poder interactuar fluidamente mientras simulo

**Criterios de aceptación**:
- **Dado** simulación ejecutándose
- **Cuando** interactúo con controles de UI
- **Entonces** la UI debe responder en <50ms
- **Y** la simulación debe continuar sin interrupciones
- **Y** no debe haber bloqueos perceptibles

#### H3.2 - Reloj de Alta Precisión
**Como** desarrollador del simulador  
**Quiero** un reloj preciso y estable  
**Para** garantizar T_s = 100ms exactos

**Criterios de aceptación**:
- **Dado** simulación ejecutándose por 1+ hora
- **Cuando** mido la frecuencia real de ticks
- **Entonces** debe ser 10.0 ± 0.1 Hz promedio
- **Y** el jitter debe ser < 5ms
- **Y** no debe haber drift acumulativo > 0.1%

#### H3.3 - Comunicación Tipada
**Como** desarrollador  
**Quiero** comunicación Worker ↔ UI tipada y confiable  
**Para** evitar errores de runtime y facilitar debugging

**Criterios de aceptación**:
- **Dado** cualquier mensaje UI → Worker
- **Cuando** envío el mensaje
- **Entonces** debe ser validado automáticamente contra schema
- **Y** errores de tipo deben detectarse en desarrollo
- **Y** mensajes malformados deben generar error específico

#### H3.4 - Gestión de Estado Worker
**Como** usuario controlando la simulación  
**Quiero** iniciar/pausar/resetear la simulación  
**Para** controlar exactamente cuándo y cómo se ejecuta

**Criterios de aceptación**:
- **Dado** simulación en cualquier estado
- **Cuando** uso controles Start/Pause/Reset
- **Entonces** el cambio debe ser inmediato (< 100ms)
- **Y** el estado debe persistir hasta próximo comando
- **Y** Reset debe restaurar condiciones iniciales exactas

---

### E4 - Métricas y Análisis de Desempeño

#### H4.1 - Cálculo de Overshoot
**Como** estudiante aprendiendo control  
**Quiero** ver el overshoot % automáticamente  
**Para** entender cómo las ganancias PID afectan el sobrepaso

**Criterios de aceptación**:
- **Dado** cambio de SP o Reset
- **Cuando** PV supera el nuevo SP
- **Entonces** debe mostrarse overshoot % = 100*(PV_max - SP)/SP
- **Y** debe actualizarse en tiempo real hasta estabilizarse
- **Y** debe reiniciarse automáticamente con nuevos cambios de SP

#### H4.2 - Tiempo de Establecimiento
**Como** ingeniero evaluando performance  
**Quiero** ver tiempo de establecimiento ts (±2%)  
**Para** cuantificar qué tan rápido el sistema alcanza régimen permanente

**Criterios de aceptación**:
- **Dado** respuesta a escalón de SP
- **Cuando** PV entra en banda ±2% del SP
- **Entonces** debe iniciarse conteo de tiempo de hold (5s)
- **Y** si PV sale de la banda, debe reiniciarse el conteo
- **Y** ts debe mostrarse solo cuando se confirme establecimiento

#### H4.3 - Reinicio Automático de Métricas
**Como** usuario experimentando con diferentes configuraciones  
**Quiero** que las métricas se reinicien automáticamente  
**Para** no tener datos obsoletos de experimentos anteriores

**Criterios de aceptación**:
- **Dado** métricas calculadas para un escenario
- **Cuando** cambio SP significativamente (>5%) O uso Reset O aplico Preset
- **Entonces** las métricas deben reiniciarse inmediatamente
- **Y** debe indicarse visualmente que están recalculándose
- **Y** valores anteriores no deben interferir con nuevos cálculos

#### H4.4 - Métricas Integrales (Opcional)
**Como** usuario avanzado  
**Quiero** ver métricas IAE, ISE, RMSE  
**Para** análisis cuantitativo más profundo del desempeño

**Criterios de aceptación**:
- **Dado** simulación ejecutándose
- **Cuando** habilito métricas avanzadas
- **Entonces** deben calcularse IAE, ISE, RMSE en tiempo real
- **Y** deben mostrarse en panel separado o modal
- **Y** deben reiniciarse con las métricas principales

---

### E5 - Exportación y Persistencia

#### H5.1 - Exportar CSV
**Como** usuario analizando datos  
**Quiero** exportar datos de simulación en CSV  
**Para** procesarlos en herramientas externas (Excel, MATLAB, Python)

**Criterios de aceptación**:
- **Dado** simulación con datos acumulados
- **Cuando** uso "Exportar CSV"
- **Entonces** debe generarse archivo con columnas: t, SP, PV, u
- **Y** debe incluir metadatos (parámetros, configuración)
- **Y** formato debe ser estándar con decimales punto/coma según locale

#### H5.2 - Selección de Ventana de Exportación
**Como** usuario con simulación larga  
**Quiero** elegir qué exportar (ventana visible vs todo)  
**Para** no generar archivos innecesariamente grandes

**Criterios de aceptación**:
- **Dado** historial > ventana visible
- **Cuando** exporto CSV
- **Entonces** debo poder elegir "Ventana actual" o "Todo el historial"
- **Y** debe indicarse claramente cuántos puntos incluye cada opción
- **Y** exportación debe completarse en <5s para 10K puntos

#### H5.3 - Persistencia de Configuración
**Como** usuario frecuente  
**Quiero** que se guarden mis últimas configuraciones  
**Para** no tener que reconfigurar cada vez que uso la app

**Criterios de aceptación**:
- **Dado** configuración de parámetros personalizada
- **Cuando** cierro y reabro la aplicación
- **Entonces** deben restaurarse automáticamente los últimos valores
- **Y** debe incluir: PID, planta, modo, ventana temporal
- **Y** debe haber opción de "Restaurar defaults"

#### H5.4 - Importar/Exportar Configuraciones
**Como** instructor usando la herramienta  
**Quiero** compartir configuraciones específicas  
**Para** que estudiantes puedan cargar escenarios predefinidos

**Criterios de aceptación**:
- **Dado** configuración funcional
- **Cuando** exporto configuración
- **Entonces** debe generarse archivo JSON con todos los parámetros
- **Y** debe poder importarse en otra sesión/navegador
- **Y** importación debe validar formato y rangos

---

### E6 - Integración UI y Experiencia de Usuario

#### H6.1 - Sincronización Controles
**Como** usuario ajustando parámetros  
**Quiero** que sliders e inputs numéricos estén sincronizados  
**Para** poder usar indistintamente el método más conveniente

**Criterios de aceptación**:
- **Dado** cualquier control con slider + input
- **Cuando** cambio el valor en uno de ellos
- **Entonces** el otro debe actualizarse inmediatamente
- **Y** debe aplicarse validación de rangos en ambos
- **Y** formato numérico debe ser consistente

#### H6.2 - Feedback Visual de Estado
**Como** usuario operando la simulación  
**Quiero** ver claramente el estado actual  
**Para** saber si está corriendo, pausada o detenida

**Criterios de aceptación**:
- **Dado** cualquier estado de simulación
- **Cuando** observo la interfaz
- **Entonces** debe ser inmediatamente obvio el estado actual
- **Y** botones deben mostrar próxima acción disponible
- **Y** debe usar colores/iconos intuitivos

#### H6.3 - Responsividad de Controles
**Como** usuario interactuando con la app  
**Quiero** que todos los controles respondan instantáneamente  
**Para** tener sensación de control directo

**Criterios de aceptación**:
- **Dado** cualquier control de UI
- **Cuando** interactúo con él
- **Entonces** debe dar feedback visual en <50ms
- **Y** cambios deben aplicarse a simulación en <100ms
- **Y** no debe haber delays perceptibles

#### H6.4 - Tema Oscuro Completo
**Como** usuario trabajando en ambientes con poca luz  
**Quiero** tema oscuro completo y bien diseñado  
**Para** reducir fatiga visual

**Criterios de aceptación**:
- **Dado** tema oscuro activo
- **Cuando** uso cualquier parte de la app
- **Entonces** todos los elementos deben ser consistentes con tema
- **Y** contraste debe cumplir WCAG 2.1 AA (4.5:1 mínimo)
- **Y** no debe haber "flashazos" de fondo blanco

---

### E7 - QA, Testing y Validación

#### H7.1 - Suite de Tests Unitarios
**Como** desarrollador  
**Quiero** tests unitarios completos para lógica crítica  
**Para** detectar regresiones rápidamente

**Criterios de aceptación**:
- **Dado** lógica de PID, planta, métricas
- **Cuando** ejecuto suite de tests
- **Entonces** cobertura debe ser >= 80%
- **Y** tests deben ejecutarse en <30s
- **Y** deben incluir casos edge y valores límite

#### H7.2 - Validación Numérica Automatizada
**Como** desarrollador responsable de precisión  
**Quiero** tests que validen contra soluciones conocidas  
**Para** garantizar exactitud matemática

**Criterios de aceptación**:
- **Dado** casos con solución analítica conocida
- **Cuando** ejecuto tests de validación
- **Entonces** error debe ser < 1% vs solución exacta
- **Y** debe incluir casos: L=0, escalón, rampa
- **Y** debe validar estabilidad a largo plazo

#### H7.3 - Tests de Performance
**Como** desarrollador preocupado por UX  
**Quiero** tests automatizados de performance  
**Para** detectar degradaciones de rendimiento

**Criterios de aceptación**:
- **Dado** simulación corriendo bajo carga
- **Cuando** ejecuto tests de performance
- **Entonces** debe mantener 10 Hz estables
- **Y** UI debe mantener >30 FPS
- **Y** memoria no debe crecer indefinidamente

#### H7.4 - Documentación de Casos de Prueba
**Como** nuevo desarrollador en el equipo  
**Quiero** documentación clara de cómo probar  
**Para** validar cambios independientemente

**Criterios de aceptación**:
- **Dado** cualquier funcionalidad crítica
- **Cuando** consulto documentación de testing
- **Entonces** debe haber procedimiento step-by-step
- **Y** debe incluir valores esperados específicos
- **Y** debe cubrir casos normales y edge cases

---

## 3. Definition of Ready (DoR)

Una historia está **Ready** cuando:

- [ ] **Criterios de aceptación** están claros y testeable
- [ ] **Dependencias** identificadas y disponibles
- [ ] **Diseño/mockups** aprobados (si aplica)
- [ ] **Estimación** de effort realizada por el equipo
- [ ] **Valor de negocio** y **prioridad** definidos
- [ ] **Criterios técnicos** especificados (performance, etc.)
- [ ] **Definition of Done** entendida por el equipo

## 4. Definition of Done (DoD)

Una historia está **Done** cuando:

### Código
- [ ] **Funcionalidad implementada** según criterios de aceptación
- [ ] **Code review** completado y aprobado
- [ ] **Convenciones de código** respetadas (ESLint + Prettier)
- [ ] **TypeScript strict** sin errores
- [ ] **Commits convencionales** utilizados

### Testing
- [ ] **Tests unitarios** escritos y pasando (si aplica)
- [ ] **Tests de integración** pasando (si aplica)
- [ ] **Validación manual** completada
- [ ] **Casos edge** probados
- [ ] **Cross-browser testing** en navegadores principales

### Documentación
- [ ] **Documentación técnica** actualizada
- [ ] **README** actualizado si es necesario
- [ ] **Comentarios de código** en lógica compleja
- [ ] **Types documentados** con JSDoc si es necesario

### QA
- [ ] **Build de producción** exitoso
- [ ] **Performance** cumple NFRs
- [ ] **Accesibilidad** básica verificada
- [ ] **Responsividad** en móvil validada

### Deployment
- [ ] **Rama merged** a main/develop
- [ ] **Versión taggeada** si es release
- [ ] **Demo** preparado para stakeholders
- [ ] **Rollback plan** definido

## 5. Backlog Priorizado

### Prioridad 1 - Crítico (MVP)
| ID | Historia | Épica | Effort | Valor | Riesgo |
|----|----------|-------|--------|-------|--------|
| H3.1 | Worker de Simulación | E3 | 8 | Alto | Alto |
| H1.1 | Modelo FOPDT Básico | E1 | 5 | Alto | Medio |
| H2.1 | PID Posicional Básico | E2 | 5 | Alto | Medio |
| H4.1 | Cálculo de Overshoot | E4 | 3 | Alto | Bajo |
| H6.2 | Feedback Visual Estado | E6 | 2 | Alto | Bajo |

### Prioridad 2 - Importante (Post-MVP)
| ID | Historia | Épica | Effort | Valor | Riesgo |
|----|----------|-------|--------|-------|--------|
| H1.2 | Discretización Exacta | E1 | 8 | Alto | Alto |
| H2.2 | Derivada Filtrada | E2 | 5 | Medio | Medio |
| H2.3 | Anti-windup Back-calc | E2 | 5 | Medio | Medio |
| H4.2 | Tiempo Establecimiento | E4 | 5 | Alto | Medio |
| H3.2 | Reloj Alta Precisión | E3 | 5 | Medio | Alto |

### Prioridad 3 - Deseable (Futuro)
| ID | Historia | Épica | Effort | Valor | Riesgo |
|----|----------|-------|--------|-------|--------|
| H1.3 | Modo Chiller | E1 | 3 | Medio | Bajo |
| H1.4 | Ruido de Medición | E1 | 3 | Medio | Bajo |
| H5.1 | Exportar CSV | E5 | 3 | Medio | Bajo |
| H5.3 | Persistencia Config | E5 | 2 | Bajo | Bajo |
| H6.1 | Sincronización Controles | E6 | 3 | Medio | Bajo |

### Prioridad 4 - Opcional (Nice-to-have)
| ID | Historia | Épica | Effort | Valor | Riesgo |
|----|----------|-------|--------|-------|--------|
| H4.4 | Métricas Integrales | E4 | 5 | Bajo | Bajo |
| H5.4 | Import/Export Config | E5 | 5 | Bajo | Bajo |
| H7.1 | Suite Tests Unitarios | E7 | 8 | Alto | Bajo |
| H7.2 | Validación Numérica | E7 | 5 | Alto | Bajo |

## 6. Roadmap por Sprints

### Sprint 1 (Semanas 1-2): "Fundación Técnica"
**Objetivo**: Establecer la arquitectura base con Worker funcional y modelo de planta básico

**Historias incluidas**:
- H3.1: Worker de Simulación (8 pts)
- H1.1: Modelo FOPDT Básico (5 pts) 
- H6.2: Feedback Visual Estado (2 pts)

**Total: 15 story points**

**Riesgos**:
- **Alto**: Complejidad de Worker multi-threading
- **Medio**: Estabilidad numérica del modelo

**Mitigaciones**:
- Spike técnico Worker de 1 día antes de implementar
- Validación contra casos simples (L=0) desde día 1

**Entregables**:
- Worker funcional con comunicación básica
- Modelo FOPDT respondiendo a escalones
- UI mostrando estado de simulación claramente
- Demo de escalón básico funcionando

**Criterios de éxito Sprint**:
- Simulación a 10 Hz estable por 10+ minutos
- Respuesta escalón visualmente correcta
- Worker no bloquea UI durante operación

---

### Sprint 2 (Semanas 3-4): "Control PID Core"
**Objetivo**: Implementar controlador PID funcional con ganancias ajustables

**Historias incluidas**:
- H2.1: PID Posicional Básico (5 pts)
- H4.1: Cálculo de Overshoot (3 pts)
- H3.3: Comunicación Tipada (5 pts)
- H6.1: Sincronización Controles (3 pts)

**Total: 16 story points**

**Riesgos**:
- **Medio**: Tuning inicial de PID puede ser inestable
- **Bajo**: Sincronización slider ↔ input

**Mitigaciones**:
- Usar ganancias conservadoras por defecto
- Implementar límites estrictos desde el inicio

**Entregables**:
- PID completo con Kp, Ki, Kd ajustables
- Overshoot % mostrado en tiempo real
- Controles de UI totalmente funcionales
- Casos de prueba básicos documentados

**Criterios de éxito Sprint**:
- Usuario puede ajustar ganancias y ver efecto inmediatamente
- Overshoot calculado correctamente para casos conocidos
- No hay oscilaciones destructivas con parámetros razonables

---

### Sprint 3 (Semanas 5-6): "Precisión y Robustez"
**Objetivo**: Mejorar precisión numérica y robustecer el control

**Historias incluidas**:
- H1.2: Discretización Exacta (8 pts)
- H2.2: Derivada Filtrada (5 pts)
- H4.2: Tiempo Establecimiento (5 pts)

**Total: 18 story points**

**Riesgos**:
- **Alto**: Cambio de discretización puede introducir bugs
- **Medio**: Cálculo de ts requiere lógica compleja

**Mitigaciones**:
- Tests de regresión exhaustivos antes del cambio
- Implementar ts con casos simples primero

**Entregables**:
- Discretización exacta validada vs analítica
- Derivada filtrada funcionando con ruido
- Tiempo de establecimiento calculado automáticamente
- Documentación de precisión numérica

**Criterios de éxito Sprint**:
- Error vs solución analítica < 0.5%
- Derivada estable con ruido moderado
- ts calculado correctamente en casos de prueba

---

### Sprint 4 (Semanas 7-8): "Features Completas y Polish"
**Objetivo**: Completar funcionalidades restantes y pulir experiencia

**Historias incluidas**:
- H2.3: Anti-windup Back-calculation (5 pts)
- H1.3: Modo Chiller (3 pts)
- H1.4: Ruido de Medición (3 pts)
- H5.1: Exportar CSV (3 pts)
- H7.1: Suite Tests Unitarios (4 pts)

**Total: 18 story points**

**Riesgos**:
- **Medio**: Anti-windup puede requerir fine-tuning
- **Bajo**: Features adicionales son relativamente simples

**Mitigaciones**:
- Probar anti-windup con casos extremos (SP muy altos)
- Implementar features simples primero para momentum

**Entregables**:
- Producto completo con todas las features MVP
- Modo chiller funcional
- Exportación CSV operativa
- Suite de tests automatizada
- Documentación de usuario final

**Criterios de éxito Sprint**:
- Anti-windup previene overshoot excesivo
- Modo chiller comportamiento simétrico a horno
- CSV exportado importable en Excel/MATLAB
- Tests pasan en CI/CD

---

## 7. Plan de Release

### Release 0.1.0 - MVP (Fin Sprint 2)
**Contenido**: Worker + FOPDT + PID básico + UI funcional
**Audiencia**: Equipo interno y early adopters
**Objetivo**: Validar concepto core

### Release 0.2.0 - Beta (Fin Sprint 3)  
**Contenido**: Precisión numérica + métricas completas
**Audiencia**: Instructores y estudiantes piloto
**Objetivo**: Validar precisión y utilidad educativa

### Release 1.0.0 - Production (Fin Sprint 4)
**Contenido**: Todas las features, documentación completa
**Audiencia**: Público general
**Objetivo**: Lanzamiento para adopción masiva

## 8. Métricas de Éxito por Sprint

### Sprint 1
- **Técnico**: 10 Hz estables por 30+ minutos
- **Funcional**: Respuesta escalón visualmente correcta
- **UX**: Estado de simulación claro para usuarios

### Sprint 2  
- **Técnico**: PID estable con ganancias en rango válido
- **Funcional**: Overshoot medido vs esperado ±5%
- **UX**: Controles respondan en <100ms

### Sprint 3
- **Técnico**: Error numérico vs analítico <0.5%
- **Funcional**: ts medido vs esperado ±10%
- **UX**: Filtro derivativo efectivo contra ruido

### Sprint 4
- **Técnico**: Cobertura tests ≥75%
- **Funcional**: Anti-windup previene >50% overshoot excesivo
- **UX**: Export CSV funcional en herramientas estándar
