# SPRINT 2: "Control PID Core" (Semanas 3-4)

## 📋 Objetivo del Sprint
**Implementar controlador PID posicional completo con ganancias ajustables en tiempo real, cálculo automático de overshoot y comunicación robusta Worker↔UI.**

## 📊 Información General
- **Duración**: 2 semanas (10 días laborables)
- **Total Story Points**: 16 pts
- **Capacidad estimada**: 16-18 pts
- **Riesgo global**: MEDIO (funcionalidad core pero arquitectura establecida)

---

## 🎯 Historias de Usuario del Sprint

### H2.1 - PID Posicional Básico (5 pts) - ÉPICA E2
**Como** estudiante de control automático  
**Quiero** ajustar ganancias Kp, Ki, Kd en tiempo real  
**Para** ver inmediatamente el efecto en la respuesta del sistema

#### Descripción detallada
Implementar controlador PID posicional con las tres ganancias estándar. El controlador debe calcular términos proporcional, integral y derivativo por separado, aplicar saturación de salida y permitir ajuste en tiempo real desde UI.

#### Criterios de aceptación
- **Dado** ganancias PID válidas Kp=2.0, Ki=0.1s⁻¹, Kd=10s
- **Cuando** cambio cualquier ganancia con slider o input numérico
- **Entonces** el controlador debe aplicar el cambio inmediatamente (<100ms)
- **Y** la respuesta debe cambiar visiblemente en gráfica en tiempo real
- **Y** las unidades deben ser estándar (Kp adimensional, Ki s⁻¹, Kd s)
- **Y** salida u debe estar limitada a rango [0,1] siempre
- **Y** debe mostrar términos P, I, D por separado para debug

#### Tareas técnicas
1. Crear clase `PIDController` con ganancias configurables
2. Implementar cálculo posicional: `u = Kp*e + Ki*∫e*dt + Kd*de/dt`
3. Implementar integrador con acumulación discreta
4. Implementar derivada básica sobre error (sin filtro por ahora)
5. Aplicar saturación u ∈ [0,1] con clamps
6. Integrar con Worker y modelo FOPDT del Sprint 1
7. Conectar sliders de ganancias PID con actualización tiempo real
8. Agregar logging de términos P, I, D para debugging

#### Definition of Done específicos
- [ ] PID responde a escalón SP con overshoot < 50%
- [ ] Cambios ganancias UI→Worker en <100ms
- [ ] Términos P, I, D visibles en modo debug
- [ ] Salida u siempre en [0,1] sin excepciones
- [ ] Integrador acumula correctamente sin reset involuntario
- [ ] Tests unitarios PID con casos conocidos

---

### H4.1 - Cálculo de Overshoot (3 pts) - ÉPICA E4
**Como** estudiante aprendiendo control  
**Quiero** ver el overshoot % automáticamente  
**Para** entender cómo las ganancias PID afectan el sobrepaso

#### Descripción detallada
Implementar algoritmo de detección y cálculo de overshoot porcentual que se active tras cambios de setpoint. Debe detectar pico máximo y calcular overshoot relativo al SP.

#### Criterios de aceptación
- **Dado** cambio de SP de 25°C→60°C o Reset de simulación
- **Cuando** PV supera el nuevo SP durante respuesta transitoria
- **Entonces** debe mostrarse overshoot % = 100*(PV_max - SP)/SP en tiempo real
- **Y** debe actualizarse continuamente hasta que se estabilice
- **Y** debe reiniciarse automáticamente con nuevos cambios de SP >5%
- **Y** debe manejar caso SP=0 con overshoot absoluto
- **Y** debe mostrar tiempo del pico (t_peak)

#### Tareas técnicas
1. Crear clase `MetricsCalculator` para overshoot
2. Implementar detector de picos en señal PV
3. Calcular overshoot % = (PV_max - SP)/SP * 100
4. Implementar reset automático de métricas tras cambio SP
5. Manejar casos edge: SP=0, cambios negativos de SP
6. Integrar con UI en componente MetricCard
7. Validar contra casos conocidos de literatura

#### Definition of Done específicos
- [ ] Overshoot calculado ±2% vs casos teóricos
- [ ] Reset automático funciona tras cambio SP >5%
- [ ] Maneja correctamente SP=0 y transiciones negativas
- [ ] Actualización en tiempo real sin lag perceptible
- [ ] Tiempo de pico mostrado con precisión ±0.5s
- [ ] MetricCard actualiza visualmente el valor

---

### H3.3 - Comunicación Tipada (5 pts) - ÉPICA E3
**Como** desarrollador  
**Quiero** comunicación Worker ↔ UI tipada y confiable  
**Para** evitar errores de runtime y facilitar debugging

#### Descripción detallada
Robustecer la comunicación Worker↔UI con tipos TypeScript completos, validación de mensajes, manejo de errores y logging para debugging. Implementar contratos de mensaje formales.

#### Criterios de aceptación
- **Dado** cualquier mensaje UI→Worker (SET_PID, SET_SP, etc.)
- **Cuando** envío el mensaje desde UI
- **Entonces** debe ser validado automáticamente contra schema TypeScript
- **Y** errores de tipo deben detectarse en desarrollo con ESLint
- **Y** mensajes malformados deben generar error específico con código
- **Y** debe haber logging estructurado para debugging
- **Y** Worker debe confirmar recepción con ACK message

#### Tareas técnicas
1. Definir tipos completos para todos los mensajes Worker↔UI
2. Implementar validación automática con Zod schemas
3. Crear sistema de ACK/NACK para confirmación de comandos
4. Implementar códigos de error estándar (CFG_001, SIM_001, etc.)
5. Agregar logging estructurado con niveles (DEBUG, INFO, WARN, ERROR)
6. Crear herramientas de debugging para mensajes
7. Documentar protocolo de comunicación completo

#### Definition of Done específicos
- [ ] Todos los mensajes tipados con TypeScript strict
- [ ] Validación automática evita mensajes malformados
- [ ] Sistema ACK confirma comandos críticos
- [ ] Logging estructurado facilita debugging
- [ ] Códigos de error documentados y consistentes
- [ ] Zero runtime errors por mensajes inválidos

---

### H6.1 - Sincronización Controles (3 pts) - ÉPICA E6
**Como** usuario ajustando parámetros  
**Quiero** que sliders e inputs numéricos estén sincronizados  
**Para** poder usar indistintamente el método más conveniente

#### Descripción detallada
Completar sincronización bidireccional entre sliders y inputs numéricos. Validar rangos en ambos controles y asegurar formato numérico consistente.

#### Criterios de aceptación
- **Dado** cualquier control con slider + input (Kp, Ki, Kd, SP, etc.)
- **Cuando** cambio el valor en uno de ellos
- **Entonces** el otro debe actualizarse inmediatamente sin delay
- **Y** debe aplicarse validación de rangos en ambos controles
- **Y** formato numérico debe ser consistente (decimales, separadores)
- **Y** debe haber debouncing para evitar spam de mensajes
- **Y** valores fuera de rango deben ser clampeados visualmente

#### Tareas técnicas
1. Completar componente SliderWithInput bidireccional
2. Implementar validación de rangos con clamps visuales
3. Agregar debouncing para reducir mensajes Worker
4. Estandarizar formato numérico (decimales según step)
5. Manejar casos edge: valores vacíos, NaN, Infinity
6. Aplicar a todos los controles numéricos existentes
7. Validar UX con testing manual

#### Definition of Done específicos
- [ ] Sincronización bidireccional en <50ms
- [ ] Validación de rangos en ambos controles
- [ ] Formato numérico consistente aplicado
- [ ] Debouncing reduce mensajes Worker >50%
- [ ] Casos edge manejados sin crashes
- [ ] UX fluida verificada en todos los controles

---

## 🎯 Objetivos Medibles del Sprint

### Criterios de Éxito Técnico
- ✅ **PID funcional**: Respuesta escalón con overshoot controlado (15-35%)
- ✅ **Responsividad**: Cambios ganancias aplicados en <100ms
- ✅ **Comunicación robusta**: Zero errores tipo en Worker↔UI por 2+ horas
- ✅ **Sincronización**: Controles UI sincronizados en <50ms

### Criterios de Éxito Funcional
- ✅ **Overshoot automático**: Calculado ±5% vs casos teóricos conocidos
- ✅ **Control en tiempo real**: Ajuste ganancias con efecto visual inmediato
- ✅ **Métricas educativas**: Overshoot % ayuda a entender efecto ganancias

### Criterios de Éxito UX
- ✅ **Controles fluidos**: Sliders/inputs sincronizados sin lag
- ✅ **Feedback inmediato**: Cambios PID visibles en <100ms
- ✅ **Información útil**: Overshoot % mostrado claramente

---

## ⚠️ Riesgos del Sprint y Mitigaciones

### 🟡 Riesgo Medio: Tuning PID Inicial Inestable
**Probabilidad**: Media | **Impacto**: Medio
- **Mitigación**: Usar ganancias conservadoras por defecto (Kp=1.5, Ki=0.05, Kd=5)
- **Plan B**: Implementar límites estrictos para prevenir oscilaciones
- **Indicadores**: Oscilaciones sostenidas con ganancias por defecto

### 🟢 Riesgo Bajo: Sincronización Slider↔Input
**Probabilidad**: Baja | **Impacto**: Bajo
- **Mitigación**: Usar estado React centralizado con useCallback
- **Plan B**: Implementar por separado si es necesario
- **Indicadores**: Lag >100ms en sincronización

---

## 📦 Entregables del Sprint

1. **Controlador PID completo** - Con Kp, Ki, Kd ajustables en tiempo real
2. **Cálculo overshoot automático** - Métrica educativa funcionando
3. **Comunicación robusta** - Worker↔UI tipada con manejo errores
4. **UI controles sincronizados** - Sliders/inputs bidireccionales
5. **Demo PID educativo** - Efecto de ganancias visible inmediatamente
6. **Tests de integración** - Validación PID + métricas + comunicación

---

## 📈 Métricas de Monitoreo

### Durante el Sprint
- **Daily**: Burn-down y velocity tracking
- **Daily**: Estabilidad PID con diferentes ganancias
- **Semanal**: Performance comunicación Worker↔UI

### Al Final del Sprint
- **Sprint Review**: Demo PID completo con métricas
- **Sprint Retrospective**: Lecciones sobre implementación PID
- **Release 0.1.0**: MVP técnico funcionando

---

## 🔄 Dependencias y Preparación

### Pre-requisitos del Sprint 1
- [x] Web Worker funcional y estable
- [x] Modelo FOPDT básico respondiendo a escalones
- [x] Comunicación básica UI↔Worker establecida
- [x] UI estados visuales implementados

### Dependencias externas
- **Literatura PID**: Casos de validación para overshoot
- **Testing**: Herramientas para medir latencia Worker

### Preparación requerida
- **Research PID**: 0.5 días revisión algoritmos estándar
- **Validación matemática**: Casos conocidos para testing

---

## 🎓 Valor Educativo

Este sprint implementa el **corazón educativo** del simulador:
- **Ganancias PID ajustables** permiten experimentación inmediata
- **Overshoot automático** enseña relación ganancias↔comportamiento
- **Términos P, I, D separados** facilitan comprensión conceptual
- **Respuesta tiempo real** conecta teoría con práctica

---

**Responsable Sprint**: Scrum Master  
**Tech Lead**: Lead Developer  
**PID Expert**: Control Systems Engineer  
**Revisado por**: Product Owner  
**Última actualización**: 2024-01-XX
