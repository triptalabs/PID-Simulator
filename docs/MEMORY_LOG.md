# Memory Log - Apuntes y Memorias del Proyecto

## 🧠 Memorias del Proyecto (Una línea por memoria)

### 📅 2024-01-XX - Planificación Inicial
- Documentación SCRUM completa creada: 7 épicas, 28+ historias, 4 sprints planificados
- Decisión crítica: Discretización exacta vs Euler → Elegimos exacta por estabilidad incondicional
- Decisión crítica: Derivada sobre medida (no error) + anti-windup back-calculation
- Arquitectura definida: Actor Model con Web Worker + mensajes tipados a 10Hz
- Stack tecnológico fijo: React 18 + shadcn/ui + Tailwind + Vite + TypeScript strict
- Gestor de paquetes: pnpm exclusivamente (preferencia usuario)
- Idioma: Todo en español (UI, docs, comentarios)
- Riesgo #1 identificado: Inestabilidad numérica en simulación
- Plan de validación: Tests vs soluciones analíticas obligatorios (error < 0.5%)
- Contratos UI ↔ Worker especificados completamente en docs/02-architecture-and-contract.md

### 📅 2024-01-XX - Integración GitHub Issues
- Cursor rules renombrado a @agents.mdc para nueva convención
- Integrado flujo automático de GitHub Issues con detección inteligente
- Triggers: "issue #X", "trabajar en issue #X", "fix issue #X" activan flujo especial
- Flujo GitHub: sync repo → fetch issue → crear rama → roadmap → aprobación → implementar → commit/PR
- Usuario GitHub confirmado: triptalabs | Repo: PID-Simulator
- Sistema dual: desarrollo estándar vs manejo de issues con workflows diferenciados

### 📅 2025-08-21 21:23 - Timestamp Automático en Memorias
- Modificado @agents.mdc para exigir fecha/hora del sistema en todas las memorias
- Formato obligatorio: `### 📅 YYYY-MM-DD HH:MM - [Contexto]`
- Agregada sección "📝 Gestión de Memorias" con instrucciones específicas
- Sistema debe obtener timestamp actual con herramientas disponibles
- Versión actualizada a v1.4

### 📅 Próximas memorias...
- Sprint 1 objetivo: Worker + FOPDT + UI básica funcionando
- Criterio éxito Sprint 1: 10 Hz estables por 30+ minutos
- Validación numérica: Implementar desde día 1, no al final
- Tests unitarios: Escribir junto con código, no después

---

## 📝 Formato para Nuevas Memorias

```
### 📅 YYYY-MM-DD HH:MM - [Contexto/Sprint]
- Memoria 1: Descripción concisa de decisión/evento/lección
- Memoria 2: Otro apunte importante  
- Memoria 3: Lección aprendida clave
```

**IMPORTANTE:** Usar SIEMPRE timestamp del sistema (fecha + hora) al crear nuevas memorias.

---

**Última actualización:** 2025-08-21 21:23  
**Total memorias:** 21
