# Documentación del Proyecto - Simulador PID Horno/Chiller

## 📋 Índice de Documentación

Este directorio contiene toda la documentación de planificación y arquitectura del proyecto **Simulador PID Horno/Chiller**. La documentación sigue la metodología SCRUM y está organizada por fases del proyecto.

---

## 🔍 Fase 0: Discovery y Análisis

### [📊 Análisis Técnico](./00-discovery/analysis.md)
Análisis completo de requisitos funcionales y no funcionales, mapeo UI-Worker, decisiones técnicas clave, identificación de riesgos y definición de KPIs de validación.

**Contenido clave:**
- Requisitos funcionales y no funcionales extraídos
- Mapeo de estados UI → Worker → Mensajes
- Decisiones técnicas justificadas (discretización, anti-windup, etc.)
- Riesgos técnicos identificados y mitigaciones
- Casos de validación numérica

---

## 📈 Fase 1: Planificación SCRUM

### [🎯 Product Vision y NFRs](./01-vision-nfr.md)
Visión del producto, propuesta de valor única y especificación detallada de requisitos no funcionales.

**Contenido clave:**
- Declaración de visión y problema que resuelve
- Usuarios objetivo y diferenciadores
- NFRs categorizados (performance, escalabilidad, confiabilidad, usabilidad, etc.)
- Métricas de éxito técnicas y de negocio

### [🏗️ Arquitectura y Contrato de Mensajes](./02-architecture-and-contract.md)
Definición completa de la arquitectura UI ↔ Worker y especificación del contrato de comunicación.

**Contenido clave:**
- Patrón arquitectónico (Actor Model)
- Contrato detallado de mensajes bidireccionales
- Tipos TypeScript completos
- Garantías de idempotencia y frecuencias
- Códigos de error estándar

### [📋 Roadmap SCRUM Completo](./03-scrum-roadmap.md)
Épicas, historias de usuario, criterios de aceptación, backlog priorizado y planificación por sprints.

**Contenido clave:**
- 7 épicas principales con criterios de aceptación
- 28+ historias de usuario detalladas con formato Gherkin
- Definition of Ready (DoR) y Definition of Done (DoD)
- Backlog priorizado con estimaciones de effort
- Roadmap de 4 sprints con objetivos y entregables

### [🧪 Plan de Pruebas y Validación](./04-testing-plan.md)
Estrategia completa de testing con énfasis en validación numérica y KPIs de calidad.

**Contenido clave:**
- Pirámide de testing (70% unit, 20% integration, 10% E2E)
- Tests unitarios detallados para PID, planta y métricas
- KPIs de validación numérica con oráculos
- Casos de validación estándar vs literatura
- Plan de automatización CI/CD

### [⚠️ Registro de Riesgos y Mitigaciones](./05-risks-and-mitigations.md)
Identificación, evaluación y estrategias de mitigación para todos los riesgos del proyecto.

**Contenido clave:**
- Matriz de riesgos con probabilidad × impacto
- 12+ riesgos categorizados (técnicos, proyecto, recursos, calidad)
- Estrategias específicas de mitigación
- Plan de monitoreo con métricas y triggers
- Planes de contingencia para riesgos críticos

---

## 🤔 Architecture Decision Records (ADRs)

### [ADR-0001: Discretización Exacta vs Euler](./ADR/0001-discretizacion-exacta-vs-euler.md)
Decisión de usar discretización matemáticamente exacta para el modelo FOPDT.

**Decisión:** Discretización exacta con fallback a Euler  
**Justificación:** Estabilidad incondicional y precisión matemática exacta

### [ADR-0002: Derivada Filtrada y Anti-windup](./ADR/0002-derivada-filtrada-y-anti-windup.md)  
Decisiones sobre implementación del controlador PID con derivada filtrada y anti-windup.

**Decisiones:** 
- Derivada sobre medida (no error) con filtro 1er orden N=10
- Anti-windup por back-calculation con T_t auto-calculado

---

## 📚 Documentación Base (Referencias)

### [📄 Brief Funcional](./brief_funcional_simulador_pid_markdown.md)
Especificación funcional original del simulador con alcance y criterios de aceptación.

### [⚙️ Especificación Técnica](./logica_y_matematica_version_tecnica_programador_matematico.md)
Documentación matemática detallada de algoritmos de simulación y control.

---

## 🚀 Cómo Usar Esta Documentación

### Para Desarrolladores
1. **Inicio:** Leer [Análisis Técnico](./00-discovery/analysis.md) para entender el contexto completo
2. **Arquitectura:** Revisar [Contrato de Mensajes](./02-architecture-and-contract.md) para implementación
3. **Decisiones:** Consultar ADRs para entender el "por qué" de decisiones técnicas
4. **Testing:** Seguir [Plan de Pruebas](./04-testing-plan.md) para validación

### Para Product Owners
1. **Visión:** [Product Vision](./01-vision-nfr.md) para objetivos y métricas de éxito
2. **Planificación:** [Roadmap SCRUM](./03-scrum-roadmap.md) para épicas, historias y sprints
3. **Riesgos:** [Registro de Riesgos](./05-risks-and-mitigations.md) para toma de decisiones

### Para QA Engineers
1. **Estrategia:** [Plan de Pruebas](./04-testing-plan.md) para approach completo
2. **Criterios:** Consultar DoD in [Roadmap SCRUM](./03-scrum-roadmap.md)
3. **Validación:** Casos específicos en [Análisis Técnico](./00-discovery/analysis.md)

### Para Stakeholders
1. **Overview:** [Product Vision](./01-vision-nfr.md) para entender valor y objetivos
2. **Timeline:** [Roadmap SCRUM](./03-scrum-roadmap.md) para fechas y entregables
3. **Riesgos:** [Registro de Riesgos](./05-risks-and-mitigations.md) para awareness

---

## 📊 Estado del Proyecto

| Documento | Estado | Última Actualización |
|-----------|---------|---------------------|
| Análisis Técnico | ✅ Completo | 2024-01-XX |
| Vision y NFRs | ✅ Completo | 2024-01-XX |
| Arquitectura | ✅ Completo | 2024-01-XX |
| Roadmap SCRUM | ✅ Completo | 2024-01-XX |
| Plan de Pruebas | ✅ Completo | 2024-01-XX |
| Registro de Riesgos | ✅ Completo | 2024-01-XX |
| ADR-0001 | ✅ Completo | 2024-01-XX |
| ADR-0002 | ✅ Completo | 2024-01-XX |

---

## 🔄 Mantenimiento de la Documentación

Esta documentación es un **documento vivo** que debe mantenerse actualizado durante el desarrollo:

- **Sprint Planning:** Revisar y actualizar prioridades en roadmap
- **Sprint Review:** Actualizar estado de historias y riesgos
- **Retrospective:** Documentar lecciones aprendidas en ADRs
- **Cambios de arquitectura:** Crear nuevos ADRs según necesidad

**Responsable de mantenimiento:** Scrum Master  
**Frecuencia de revisión:** Cada sprint  
**Versionado:** Usar git para tracking de cambios

---

*Esta documentación representa el estado de planificación completo del proyecto Simulador PID Horno/Chiller. Todos los documentos están interconectados y deben consultarse en conjunto para una comprensión completa del proyecto.*
