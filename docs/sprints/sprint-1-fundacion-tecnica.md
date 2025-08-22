# SPRINT 1: "Fundación Técnica" (Semanas 1-2)

## 📋 Objetivo del Sprint
**Establecer la arquitectura base funcional con Web Worker, modelo FOPDT básico y comunicación UI↔Worker, creando los cimientos técnicos para el simulador.**

## 📊 Información General
- **Duración**: 2 semanas (10 días laborables)
- **Total Story Points**: 15 pts
- **Capacidad estimada**: 15-17 pts (equipo de 2-3 desarrolladores)
- **Riesgo global**: ALTO (nuevas tecnologías y arquitectura crítica)

---

## 🎯 Historias de Usuario del Sprint

### H3.1 - Worker de Simulación (8 pts) - ÉPICA E3
**Como** usuario de la aplicación  
**Quiero** que la simulación no bloquee la interfaz  
**Para** poder interactuar fluidamente mientras simulo

#### Descripción detallada
Implementar Web Worker dedicado que ejecute el bucle de simulación independiente del hilo principal de UI. El worker debe manejar estado interno, procesar comandos desde UI y emitir datos de simulación a frecuencia constante.

#### Criterios de aceptación
- **Dado** simulación ejecutándose en Worker
- **Cuando** interactúo con controles de UI (sliders, botones, inputs)
- **Entonces** la UI debe responder en <50ms sin lag perceptible
- **Y** la simulación debe continuar sin interrupciones o paradas
- **Y** no debe haber bloqueos perceptibles del navegador
- **Y** Worker debe comunicarse vía MessagePort con tipos definidos
- **Y** debe soportar comandos básicos: START, PAUSE, RESET, SET_PARAMS

#### Tareas técnicas
1. Crear `simulation.worker.ts` con estructura base
2. Implementar comunicación tipada UI→Worker y Worker→UI
3. Crear bucle de simulación con `setInterval` a 100ms
4. Implementar estados: STOPPED, RUNNING, PAUSED
5. Crear `SimulationProvider` React Context para UI
6. Integrar worker con controles existentes de UI
7. Validar no hay memory leaks tras 30+ minutos

#### Definition of Done específicos
- [ ] Worker ejecuta bucle estable por 30+ minutos sin degradación
- [ ] UI permanece responsiva (<50ms) durante simulación
- [ ] Mensajes Worker↔UI validados con TypeScript
- [ ] Commands START/PAUSE/RESET funcionan inmediatamente
- [ ] Zero memory leaks detectados en DevTools
- [ ] Tests básicos de comunicación Worker escritos

---

### H1.1 - Modelo FOPDT Básico (5 pts) - ÉPICA E1  
**Como** ingeniero estudiando control térmico  
**Quiero** simular un sistema de primer orden con tiempo muerto  
**Para** entender el comportamiento dinámico de procesos térmicos reales

#### Descripción detallada
Implementar modelo matemático FOPDT (First Order Plus Dead Time) usando discretización de Euler hacia adelante. El modelo debe simular respuesta térmica realista con parámetros K (ganancia), τ (constante tiempo), L (tiempo muerto) y T_amb (temperatura ambiente).

#### Criterios de aceptación
- **Dado** parámetros válidos K=0.03, τ=90s, L=3s, T_amb=25°C
- **Cuando** aplico escalón u=0.5 en entrada de control
- **Entonces** la respuesta debe seguir curva exponencial esperada 
- **Y** el tiempo muerto debe retardar inicio de respuesta exactamente L segundos
- **Y** la ganancia estática final debe ser τ·K·u = 1.35°C
- **Y** debe alcanzar 63% del valor final en tiempo τ = 90s
- **Y** valores de salida deben estar en rango [T_amb-50, T_amb+100]°C

#### Tareas técnicas
1. Crear clase `FOPDTModel` con parámetros configurables
2. Implementar discretización Euler: `x[k+1] = x[k] + Ts*(-x[k]/τ + K*u[k-Ls])`
3. Implementar buffer FIFO para tiempo muerto L
4. Integrar modelo en Worker de simulación
5. Conectar parámetros de UI (acordeón "Planta avanzado")
6. Validar contra casos conocidos (escalón, rampa)
7. Implementar clamps de seguridad para parámetros

#### Definition of Done específicos
- [ ] Respuesta escalón visualmente correcta en gráfica
- [ ] Ganancia estática medida ±5% del valor teórico
- [ ] Tiempo muerto observado ±0.2s del configurado
- [ ] Modelo estable con parámetros en rangos válidos
- [ ] Parámetros UI actualizan modelo en tiempo real
- [ ] Tests unitarios para casos básicos escritos

---

### H6.2 - Feedback Visual de Estado (2 pts) - ÉPICA E6
**Como** usuario operando la simulación  
**Quiero** ver claramente el estado actual  
**Para** saber si está corriendo, pausada o detenida

#### Descripción detallada
Mejorar indicadores visuales de estado de simulación en UI. Botones deben mostrar estado actual y próxima acción disponible. Agregar indicadores de conexión Worker y estado de salud del sistema.

#### Criterios de aceptación
- **Dado** cualquier estado de simulación (STOPPED, RUNNING, PAUSED)
- **Cuando** observo la interfaz sin leer texto
- **Entonces** debe ser inmediatamente obvio el estado actual por colores/iconos
- **Y** botón principal debe mostrar próxima acción (Iniciar/Pausar)
- **Y** debe usar colores/iconos intuitivos (verde=corriendo, naranja=pausado)
- **Y** debe haber indicador de conectividad Worker
- **Y** transiciones de estado deben ser animadas/suaves

#### Tareas técnicas
1. Actualizar componente botones Iniciar/Pausar con estados visuales
2. Agregar indicador de estado Worker (conectado/desconectado)
3. Implementar esquema de colores consistente para estados
4. Agregar animaciones CSS para transiciones de estado
5. Crear badge de estado en header del dashboard
6. Validar accesibilidad con lectores de pantalla

#### Definition of Done específicos
- [ ] Estados visuales inmediatamente reconocibles
- [ ] Botones muestran acción siguiente claramente
- [ ] Esquema de colores consistente aplicado
- [ ] Indicador Worker funcional y preciso
- [ ] Transiciones animadas implementadas
- [ ] Contraste cumple WCAG 2.1 AA (4.5:1)

---

## 🎯 Objetivos Medibles del Sprint

### Criterios de Éxito Técnico
- ✅ **Estabilidad Worker**: Simulación a 10 Hz estable por 30+ minutos sin degradación
- ✅ **Respuesta UI**: Controles responden en <50ms durante simulación activa
- ✅ **Modelo funcional**: Respuesta escalón sigue curva exponencial esperada
- ✅ **Memory usage**: Sin crecimiento >10% tras 1 hora de operación

### Criterios de Éxito Funcional  
- ✅ **Demo básico**: Escalón 25°C→60°C con respuesta visualmente correcta
- ✅ **Control tiempo real**: Cambios en parámetros K, τ, L se aplican inmediatamente
- ✅ **Estados claros**: Usuario identifica estado simulación sin ambigüedad

### Criterios de Éxito UX
- ✅ **Fluidez**: No hay lag perceptible en interacciones durante simulación
- ✅ **Feedback visual**: Estados simulación claros e intuitivos
- ✅ **Robustez**: Sin crashes por 30+ minutos de uso normal

---

## ⚠️ Riesgos del Sprint y Mitigaciones

### 🔴 Riesgo Alto: Complejidad Worker Multi-threading
**Probabilidad**: Media | **Impacto**: Alto
- **Mitigación**: Spike técnico de 1 día antes de implementar
- **Plan B**: Usar `setTimeout` en main thread como fallback temporal
- **Indicadores**: Problemas comunicación Worker después día 3

### 🟡 Riesgo Medio: Estabilidad Numérica Modelo
**Probabilidad**: Media | **Impacto**: Medio  
- **Mitigación**: Validar contra casos simples (L=0) desde día 1
- **Plan B**: Usar parámetros conservadores por defecto
- **Indicadores**: Valores NaN o explosión numérica en tests

---

## 📦 Entregables del Sprint

1. **Web Worker funcional** - Bucle simulación independiente con comunicación tipada
2. **Modelo FOPDT básico** - Respuesta escalón matemáticamente correcta
3. **UI estados visuales** - Feedback claro de estado simulación
4. **Demo escalón** - Caso de uso básico funcionando end-to-end
5. **Tests fundamentales** - Validación comunicación Worker y modelo básico
6. **Documentación técnica** - Setup Worker y modelo para próximos sprints

---

## 📈 Métricas de Monitoreo

### Durante el Sprint
- **Daily**: Burn-down chart con story points completados
- **Daily**: Estado de riesgos identificados
- **Semanal**: Performance tests (Worker estabilidad, memory usage)

### Al Final del Sprint
- **Sprint Review**: Demo completo funcionando
- **Sprint Retrospective**: Lessons learned sobre Worker y arquitectura
- **Métricas técnicas**: Cumplimiento criterios de éxito medibles

---

## 🔄 Dependencias y Preparación

### Pre-requisitos
- [ ] Estructura TypeScript del proyecto configurada
- [ ] shadcn/ui componentes base implementados
- [ ] Vite build system funcionando
- [ ] Git workflow establecido

### Dependencias externas
- **Ninguna**: Sprint auto-contenido
- **Bloqueadores**: Problemas infraestructura desarrollo

### Preparación requerida
- **Spike técnico**: 1 día investigación Web Workers
- **Setup entorno**: Herramientas debugging Worker
- **Alineación equipo**: Arquitectura y patrones código

---

**Responsable Sprint**: Scrum Master  
**Tech Lead**: Lead Developer  
**Revisado por**: Product Owner  
**Última actualización**: 2024-01-XX
