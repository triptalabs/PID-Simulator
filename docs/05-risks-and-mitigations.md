# Registro de Riesgos y Estrategias de Mitigación

## 1. Metodología de Gestión de Riesgos

### 1.1 Matriz de Clasificación

**Probabilidad**:
- **Baja (1)**: < 20% de ocurrencia
- **Media (2)**: 20-60% de ocurrencia  
- **Alta (3)**: > 60% de ocurrencia

**Impacto**:
- **Bajo (1)**: Retraso < 1 semana, funcionalidad menor afectada
- **Medio (2)**: Retraso 1-3 semanas, funcionalidad core afectada
- **Alto (3)**: Retraso > 3 semanas, bloqueo de release

**Riesgo Total = Probabilidad × Impacto**
- **1-2**: Verde (Riesgo Bajo)
- **3-4**: Amarillo (Riesgo Medio)
- **6-9**: Rojo (Riesgo Alto)

### 1.2 Estrategias de Respuesta
- **Evitar**: Cambiar planificación para eliminar el riesgo
- **Mitigar**: Reducir probabilidad o impacto
- **Transferir**: Delegar responsabilidad a terceros
- **Aceptar**: Monitoear y actuar solo si ocurre

## 2. Riesgos Técnicos

### R-T001: Inestabilidad Numérica de la Simulación
**Categoría**: Técnico - Core  
**Probabilidad**: Media (2)  
**Impacto**: Alto (3)  
**Riesgo Total**: 6 🔴

**Descripción**: La discretización del sistema FOPDT o el controlador PID pueden volverse numéricamente inestables bajo ciertas combinaciones de parámetros, causando oscilaciones divergentes o valores NaN.

**Indicadores de riesgo**:
- Parámetros extremos (τ muy pequeño, L >> τ)
- Ganancias PID muy altas
- Paso de simulación T_s inapropiado
- Acumulación de errores de punto flotante

**Causas raíz**:
- Discretización de Euler inestable para ciertos T_s/τ
- Condición mal condicionada en matriz de estado
- Integrador PID sin límites adecuados
- División por cero en cálculos de derivada

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Discretización exacta**: Usar `a = exp(-T_s/τ)` en lugar de Euler
2. **Validación de entrada**: Clamps estrictos en todos los parámetros
3. **Guards numéricos**: Verificar isFinite() en cada paso
4. **Fallback seguro**: Reseteo automático si se detecta inestabilidad
5. **Testing exhaustivo**: Suite de casos extremos automatizada

**Responsable**: Lead Developer  
**Fecha límite**: Sprint 1  
**Estado**: Activo

---

### R-T002: Drift Temporal en Simulación de Larga Duración
**Categoría**: Técnico - Performance  
**Probabilidad**: Media (2)  
**Impacto**: Medio (2)  
**Riesgo Total**: 4 🟡

**Descripción**: El reloj de simulación puede acumular errores temporales durante operación prolongada, causando deriva de la frecuencia nominal de 10 Hz.

**Indicadores de riesgo**:
- Error acumulativo > 0.1% después de 1 hora
- Frecuencia real drift de 10.0 Hz
- Timestamps irregulares en mensajes TICK
- Pérdida de sincronización con tiempo real

**Causas raíz**:
- setTimeout/setInterval no garantizan precisión
- Carga de CPU variable afecta timing
- Garbage collection pausa el Worker
- Acumulación de errores de redondeo

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Reloj compensado**: Usar performance.now() con corrección de drift
2. **Scheduling adaptativo**: Ajustar siguiente timeout basado en error acumulado
3. **Prioridad Worker**: Usar requestAnimationFrame cuando sea posible
4. **Monitoring continuo**: Alertar si drift > umbral
5. **Recalibración automática**: Reset periódico del contador

**Responsable**: Worker Specialist  
**Fecha límite**: Sprint 2  
**Estado**: Activo

---

### R-T003: Memory Leaks en Buffers de Historial
**Categoría**: Técnico - Recursos  
**Probabilidad**: Media (2)  
**Impacto**: Medio (2)  
**Riesgo Total**: 4 🟡

**Descripción**: Los buffers circulares de datos históricos pueden crecer indefinidamente o no liberar memoria adecuadamente, causando degradación progresiva.

**Indicadores de riesgo**:
- Uso de memoria creciente sin límite
- Performance degradada después de horas de uso
- Browser se vuelve lento o crash por OOM
- GC frecuente con impacto en UI

**Causas raíz**:
- Buffer circular mal implementado
- Referencias no liberadas a objetos viejos
- Event listeners no removidos
- Closures capturando contexto grande

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Buffers con límite duro**: Máximo absoluto de puntos
2. **Cleanup automático**: Garbage collection manual periódico
3. **Profiling regular**: Monitoreo de memoria en desarrollo
4. **Weak references**: Donde sea aplicable
5. **Tests de larga duración**: Validar estabilidad por 8+ horas

**Responsable**: Performance Engineer  
**Fecha límite**: Sprint 3  
**Estado**: Monitoreo

---

### R-T004: Incompatibilidad entre Navegadores
**Categoría**: Técnico - Compatibilidad  
**Probabilidad**: Media (2)  
**Impacto**: Medio (2)  
**Riesgo Total**: 4 🟡

**Descripción**: Diferencias en implementación de Web Workers, performance.now(), o APIs de Canvas entre navegadores pueden causar comportamiento inconsistente.

**Indicadores de riesgo**:
- Tests pasan en Chrome pero fallan en Firefox/Safari
- Performance significativamente diferente
- Features no disponibles en ciertos browsers
- UI broken en mobile browsers

**Causas raíz**:
- Soporte diferente de Web Worker features
- Precisión variante de performance.now()
- Canvas/WebGL capabilities diferentes
- Mobile safari limitaciones específicas

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Testing cross-browser**: CI en Chrome, Firefox, Safari
2. **Feature detection**: Graceful fallback para APIs no soportadas
3. **Polyfills**: Para funcionalidades críticas faltantes
4. **Performance budgets**: Diferentes para cada browser
5. **Progressive enhancement**: Core funcional en todos, extras en modernos

**Responsable**: QA Engineer  
**Fecha límite**: Sprint 4  
**Estado**: Monitoreo

---

### R-T005: Bloqueo de UI por Cálculos Pesados
**Categoría**: Técnico - UX  
**Probabilidad**: Baja (1)  
**Impacto**: Alto (3)  
**Riesgo Total**: 3 🟡

**Descripción**: Cálculos complejos (ej: métricas, export CSV) ejecutados en main thread pueden bloquear la interfaz de usuario.

**Indicadores de riesgo**:
- UI freeze durante operaciones
- Latencia > 100ms en controles
- Frame drops durante export
- Browser "No responde" warnings

**Causas raíz**:
- Cálculos síncronos en main thread
- Export de datasets grandes no chunked
- Rendering de gráficas pesado
- Lack de debouncing en inputs

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Offload al Worker**: Mover cálculos pesados fuera del main thread
2. **Chunking**: Procesar exports en pequeños batches
3. **RequestAnimationFrame**: Para operaciones de UI intensivas
4. **Debouncing**: En inputs que triggeren cálculos
5. **Loading states**: Feedback visual durante operaciones largas

**Responsable**: UI Developer  
**Fecha límite**: Sprint 2  
**Estado**: Monitoreo

## 3. Riesgos de Proyecto

### R-P001: Complejidad Matemática Subestimada
**Categoría**: Proyecto - Scope  
**Probabilidad**: Media (2)  
**Impacto**: Alto (3)  
**Riesgo Total**: 6 🔴

**Descripción**: La implementación correcta de discretización exacta, anti-windup y métricas puede ser más compleja de lo estimado, requiriendo investigación adicional.

**Indicadores de riesgo**:
- Sprint 1 burn-down muy lento
- Múltiples bugs en lógica matemática
- Tests de validación fallando consistentemente
- Team reporta dificultades técnicas

**Causas raíz**:
- Estimaciones optimistas de complejidad
- Falta de expertise en control digital
- Documentación matemática insuficiente
- Requirements matemáticos cambiantes

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Spike research**: 2 días investigación antes de Sprint 1
2. **Expert consultation**: Acceso a especialista en control
3. **Incremental complexity**: Implementar Euler first, exacta después
4. **Pair programming**: En componentes matemáticos críticos
5. **Buffer de tiempo**: 20% extra en historias matemáticas

**Responsable**: Scrum Master  
**Fecha límite**: Pre-Sprint 1  
**Estado**: Activo

---

### R-P002: Dependencias Externas No Controladas
**Categoría**: Proyecto - Dependencias  
**Probabilidad**: Baja (1)  
**Impacto**: Medio (2)  
**Riesgo Total**: 2 🟢

**Descripción**: Librerías críticas (React, Recharts, shadcn/ui) pueden introducir breaking changes o tener bugs que afecten desarrollo.

**Indicadores de riesgo**:
- Breaking changes en minor/patch updates
- Bugs reportados en librerías usadas
- Deprecation notices de APIs utilizadas
- Security vulnerabilities en dependencias

**Causas raíz**:
- Dependencias con versionado semántico inconsistente
- Uso de features experimentales/beta
- Falta de lockfile o version pinning
- Upgrading automático sin testing

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Version pinning**: Exact versions en package.json
2. **Dependency audit**: Regular security scanning
3. **Staged upgrades**: Never upgrade during sprints activos
4. **Fallback plans**: Conocer alternativas para cada dependencia crítica
5. **Vendor independence**: Minimizar coupling fuerte con librerías

**Responsable**: DevOps Engineer  
**Fecha límite**: Setup inicial  
**Estado**: Monitoreo

---

### R-P003: Cambios de Requirements Durante Desarrollo
**Categoría**: Proyecto - Scope  
**Probabilidad**: Media (2)  
**Impacto**: Medio (2)  
**Riesgo Total**: 4 🟡

**Descripción**: Stakeholders pueden solicitar cambios significativos en funcionalidad durante los sprints, afectando timeline y scope.

**Indicadores de riesgo**:
- Requests de nuevas features durante sprint
- Cambios en criterios de aceptación
- Feedback de usuarios que sugiere pivot
- Decisiones de diseño reconsidered

**Causas raíz**:
- Requirements iniciales incompletos
- Falta de prototipo temprano
- Stakeholder expectations no alineadas
- User feedback no anticipado

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Change control process**: Formal process para cambios mid-sprint
2. **Sprint buffer**: 10% capacidad reservada para cambios
3. **Regular demos**: Feedback temprano y frecuente
4. **MVP focus**: Core features locked, extras negociables
5. **Stakeholder education**: Sobre impacto de cambios

**Responsable**: Product Owner  
**Fecha límite**: Durante proyecto  
**Estado**: Activo

## 4. Riesgos de Recursos

### R-R001: Key Developer Unavailability
**Categoría**: Recursos - Personal  
**Probabilidad**: Baja (1)  
**Impacto**: Alto (3)  
**Riesgo Total**: 3 🟡

**Descripción**: El desarrollador líder con expertise en matemáticas/control puede volverse no disponible (enfermedad, cambio de trabajo, etc.).

**Indicadores de riesgo**:
- Conocimiento concentrado en una persona
- Falta de documentación de decisiones críticas
- Componentes que solo una persona entiende
- Bus factor = 1 para áreas críticas

**Causas raíz**:
- Especialización excesiva
- Falta de knowledge transfer
- Documentación técnica insuficiente
- Team size pequeño

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Knowledge sharing**: Pair programming en componentes críticos
2. **Documentation first**: ADRs y docs técnicas detalladas
3. **Cross-training**: Más de un dev familiarizado con cada área
4. **Code reviews**: Mandatory para spreading knowledge
5. **Backup planning**: Identificar external consultant si necesario

**Responsable**: Engineering Manager  
**Fecha límite**: Sprint 2  
**Estado**: Monitoreo

---

### R-R002: Hardware/Infrastructure Limitations
**Categoría**: Recursos - Infraestructura  
**Probabilidad**: Baja (1)  
**Impacto**: Medio (2)  
**Riesgo Total**: 2 🟢

**Descripción**: Limitaciones de hardware de desarrollo o infraestructura de testing pueden impactar productividad.

**Indicadores de riesgo**:
- Tests lentos por hardware limitado
- Build times excesivos
- CI/CD pipeline unreliable
- Development environment issues

**Causas raíz**:
- Hardware de desarrollo obsoleto
- CI runners insuficientes
- Network connectivity issues
- Toolchain mal configurado

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Local optimization**: Optimizar setup de desarrollo local
2. **Cloud CI**: Usar runners cloud para reliability
3. **Parallel testing**: Distribuir tests para velocidad
4. **Backup infrastructure**: Plan B para CI/deployment
5. **Hardware upgrade**: Budget para hardware si necesario

**Responsable**: DevOps Engineer  
**Fecha límite**: Setup inicial  
**Estado**: Mitigar

## 5. Riesgos de Calidad

### R-Q001: Validación Numérica Insuficiente
**Categoría**: Calidad - Testing  
**Probabilidad**: Media (2)  
**Impacto**: Alto (3)  
**Riesgo Total**: 6 🔴

**Descripción**: La simulación puede pasar tests básicos pero fallar en casos reales debido a validación matemática insuficiente.

**Indicadores de riesgo**:
- Casos de prueba limitados
- Validación solo contra casos simples
- Falta de benchmarks vs literatura
- User feedback sobre precisión

**Causas raíz**:
- Oráculos de testing inadecuados
- Casos edge no considerados
- Validación vs herramientas externas faltante
- Testing mathematical expertise limitado

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Benchmarking riguroso**: Validar vs MATLAB/Simulink
2. **Literature validation**: Casos de literatura conocidos
3. **Expert review**: Validación por especialista externo
4. **Automated oracles**: Tests con soluciones analíticas
5. **User acceptance testing**: Con usuarios técnicos reales

**Responsable**: QA Lead  
**Fecha límite**: Sprint 3  
**Estado**: Activo

---

### R-Q002: UI/UX No Cumple Expectativas Educativas
**Categoría**: Calidad - UX  
**Probabilidad**: Media (2)  
**Impacto**: Medio (2)  
**Riesgo Total**: 4 🟡

**Descripción**: La interfaz puede ser técnicamente correcta pero no efectiva para enseñanza/aprendizaje de conceptos PID.

**Indicadores de riesgo**:
- User testing muestra confusión
- Métricas no son auto-explicativas
- Feedback que es "muy técnico" o "muy simple"
- Abandono temprano en user testing

**Causas raíz**:
- UX design sin input educativo
- Falta de user personas educativas
- Testing solo con desarrolladores
- Missing contextual help/explanations

**Estrategia**: Mitigar  
**Mitigaciones**:
1. **Educator involvement**: Input de instructores desde Sprint 1
2. **Student testing**: Testing con target audience real
3. **Contextual help**: Tooltips y explicaciones integradas
4. **Progressive disclosure**: UI que escala con expertise
5. **Educational review**: Review formal de value educativo

**Responsable**: UX Designer  
**Fecha límite**: Sprint 3  
**Estado**: Activo

## 6. Plan de Monitoreo

### 6.1 Métricas de Riesgo

| Métrica | Frecuencia | Umbral Riesgo | Acción |
|---------|------------|---------------|---------|
| **Test coverage crítica** | Daily | < 75% | Review inmediato |
| **Build success rate** | Per commit | < 95% | Investigation |
| **Numerical validation pass rate** | Per PR | < 100% | Block merge |
| **Performance regression** | Weekly | > 10% slower | Performance review |
| **Memory usage growth** | Daily | > 5% vs baseline | Memory audit |
| **Sprint burn-down** | Daily | > 20% behind | Escalation |

### 6.2 Triggers de Escalación

**Inmediata** (dentro de 24h):
- Falla de validación numérica crítica
- Inestabilidad numérica en prod
- Key developer no disponible

**Semanal** (próxima reunión de equipo):
- Performance regression significativa
- Coverage drop below threshold
- Sprint significantly behind

**Mensual** (sprint retrospective):
- Riesgos nuevos identificados
- Mitigaciones no efectivas
- Resource constraints

### 6.3 Comunicación de Riesgos

**Daily Standup**: Status de riesgos rojos  
**Sprint Review**: Review completo de todos los riesgos  
**Retrospective**: Efectividad de mitigaciones  
**Stakeholder Updates**: Riesgos que afectan timeline/scope

## 7. Planes de Contingencia

### 7.1 Discretización Inestable (R-T001)
**Plan A**: Fallback a Euler con paso adaptativo  
**Plan B**: Biblioteca matemática externa (ej: ml-matrix)  
**Plan C**: Reducir scope a casos simples validados  

### 7.2 Performance Inaceptable (R-T002, R-T005)
**Plan A**: Web Workers para todos los cálculos pesados  
**Plan B**: Reducir frecuencia de simulación a 5 Hz  
**Plan C**: Mode "light" con menos features  

### 7.3 Timeline Critico (R-P001, R-P003)
**Plan A**: Reducir scope a MVP mínimo  
**Plan B**: Extend timeline 1 sprint adicional  
**Plan C**: Release incremental (core first, features después)  

### 7.4 Key Developer Loss (R-R001)
**Plan A**: Activar external consultant  
**Plan B**: Re-distribute work entre team existente  
**Plan C**: Delay non-critical features  

## 8. Lecciones Aprendidas y Mejora Continua

### 8.1 Proceso de Revisión de Riesgos

**Sprint Planning**: Review y update riesgo status  
**Mid-Sprint Check**: Evaluate new risks  
**Sprint Retrospective**: Assess mitigation effectiveness  
**Post-Release**: Capture lessons learned

### 8.2 Métricas de Efectividad

- **% Riesgos materializados**: Target < 20%
- **Tiempo promedio detección**: Target < 1 semana
- **% Mitigaciones efectivas**: Target > 80%
- **Impacto promedio riesgos**: Trending down

### 8.3 Mejoras Propuestas

1. **Risk poker**: Estimar riesgos como team exercise
2. **Risk champions**: Rotate responsibility entre team members
3. **External red team**: Review de riesgos por equipo externo
4. **Automated risk monitoring**: Herramientas que detecten algunos riesgos automáticamente

---

**Documento vivo**: Este registro debe actualizarse semanalmente durante el desarrollo y servir como input para decisiones de project management y planning.
