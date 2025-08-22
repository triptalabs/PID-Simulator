# Planificación de Sprints - PID Simulator

## 📋 Visión General

Esta carpeta contiene la planificación detallada de los 4 sprints del proyecto PID Simulator, siguiendo metodología SCRUM con historias de usuario en formato Gherkin y criterios de aceptación específicos.

## 🗂️ Estructura de Sprints

### [Sprint 1: "Fundación Técnica"](./sprint-1-fundacion-tecnica.md) (Semanas 1-2)
**Objetivo**: Establecer arquitectura base con Web Worker y modelo FOPDT básico  
**Story Points**: 15 pts | **Riesgo**: Alto

**Historias principales**:
- H3.1 - Worker de Simulación (8 pts)
- H1.1 - Modelo FOPDT Básico (5 pts)  
- H6.2 - Feedback Visual Estado (2 pts)

**Entregable clave**: Demo escalón básico funcionando end-to-end

---

### [Sprint 2: "Control PID Core"](./sprint-2-control-pid-core.md) (Semanas 3-4)
**Objetivo**: Implementar controlador PID completo con métricas educativas  
**Story Points**: 16 pts | **Riesgo**: Medio

**Historias principales**:
- H2.1 - PID Posicional Básico (5 pts)
- H4.1 - Cálculo de Overshoot (3 pts)
- H3.3 - Comunicación Tipada (5 pts)
- H6.1 - Sincronización Controles (3 pts)

**Entregable clave**: MVP técnico con PID ajustable y overshoot automático

---

### [Sprint 3: "Precisión y Robustez"](./sprint-3-precision-robustez.md) (Semanas 5-6)
**Objetivo**: Alcanzar precisión matemática profesional y control robusto  
**Story Points**: 18 pts | **Riesgo**: Alto

**Historias principales**:
- H1.2 - Discretización Exacta (8 pts)
- H2.2 - Derivada Filtrada (5 pts)
- H4.2 - Tiempo de Establecimiento (5 pts)

**Entregable clave**: Precisión validada vs literatura técnica

---

### [Sprint 4: "Features Completas y Polish"](./sprint-4-features-completas.md) (Semanas 7-8)
**Objetivo**: Completar MVP con anti-windup, modo chiller y exportación  
**Story Points**: 18 pts | **Riesgo**: Medio

**Historias principales**:
- H2.3 - Anti-windup Back-calculation (5 pts)
- H1.3 - Modo Chiller (3 pts)
- H1.4 - Ruido de Medición (3 pts)
- H5.1 - Exportar CSV (3 pts)
- H7.1 - Suite Tests Unitarios (4 pts)

**Entregable clave**: Release 1.0.0 Production

---

## 📊 Resumen del Proyecto

| Métrica | Valor |
|---------|-------|
| **Duración total** | 8 semanas (4 sprints) |
| **Story Points total** | 67 pts |
| **Historias de usuario** | 13 principales |
| **Épicas** | 7 épicas técnicas |
| **Releases planificados** | 3 (MVP, Beta, Production) |

---

## 🎯 Objetivos por Release

### Release 0.1.0 - MVP (Fin Sprint 2)
- ✅ Worker + FOPDT + PID básico funcionando
- ✅ Overshoot automático calculado
- ✅ Interfaz completa operativa
- **Audiencia**: Equipo interno, early adopters

### Release 0.2.0 - Beta (Fin Sprint 3)  
- ✅ Precisión matemática validada
- ✅ Derivada filtrada y métricas completas
- ✅ Estabilidad numérica garantizada
- **Audiencia**: Instructores, estudiantes piloto

### Release 1.0.0 - Production (Fin Sprint 4)
- ✅ Todas las features MVP
- ✅ Anti-windup, modo chiller, exportación
- ✅ Suite de tests automatizada
- **Audiencia**: Público general

---

## ⚠️ Gestión de Riesgos

### Riesgos Transversales
- **R-T001**: Complejidad matemática subestimada (Sprint 1, 3)
- **R-T002**: Estabilidad numérica simulación (Sprint 1, 3) 
- **R-Q001**: Validación numérica insuficiente (Sprint 3)

### Mitigaciones Principales
1. **Spike técnico** de 1 día antes de Sprint 1
2. **Tests de regresión** exhaustivos en Sprint 3
3. **Validación vs literatura** en Sprint 3
4. **Fallback plans** para cada riesgo alto

---

## 📈 Métricas de Éxito

### Técnicas
- **Precisión**: Error vs analítico <0.1%
- **Performance**: 10 Hz estables por 2+ horas
- **Estabilidad**: Zero crashes en uso normal
- **Cobertura**: ≥80% tests en código crítico

### Funcionales
- **Overshoot**: Calculado ±5% vs teórico
- **Settling time**: ±10% vs literatura
- **Responsividad**: Cambios UI en <100ms
- **Exportación**: Compatible Excel/MATLAB

### Educativas
- **Usabilidad**: Curva aprendizaje <15 min
- **Realismo**: Comportamiento = controladores industriales
- **Valor pedagógico**: Métricas auto-explicativas

---

## 🔄 Metodología SCRUM

### Definition of Ready (DoR)
- [ ] Criterios de aceptación claros y testeables
- [ ] Dependencias identificadas y disponibles
- [ ] Estimación de effort realizada
- [ ] Valor de negocio definido

### Definition of Done (DoD)
- [ ] Funcionalidad implementada según criterios
- [ ] Code review completado y aprobado
- [ ] Tests unitarios escritos y pasando
- [ ] Build de producción exitoso
- [ ] Documentación técnica actualizada

### Ceremonias
- **Daily Standups**: Progress, blockers, riesgos
- **Sprint Planning**: Commitment y capacity planning
- **Sprint Review**: Demo stakeholders y feedback
- **Sprint Retrospective**: Mejora continua

---

## 🛠️ Herramientas de Desarrollo

### Stack Técnico
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Simulación**: Web Workers + algoritmos matemáticos
- **Testing**: Vitest + Testing Library + Playwright
- **Build**: pnpm [[memory:6887303]] + ESLint + Prettier

### Gestión de Proyecto
- **Planning**: GitHub Projects / Jira
- **Code**: Git flow con feature branches
- **CI/CD**: GitHub Actions
- **Documentation**: Markdown en repositorio

---

## 📚 Referencias

- [Roadmap SCRUM completo](../03-scrum-roadmap.md)
- [Architecture Decision Records](../ADR/)
- [Plan de testing detallado](../04-testing-plan.md)
- [Gestión de riesgos](../05-risks-and-mitigations.md)

---

**Metodología**: SCRUM Ágil  
**Revisado por**: Product Owner + Scrum Master  
**Aprobado para ejecución**: 2024-01-XX  
**Próxima revisión**: Al completar Sprint 1
