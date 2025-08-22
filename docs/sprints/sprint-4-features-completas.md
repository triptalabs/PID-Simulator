# SPRINT 4: "Features Completas y Polish" (Semanas 7-8)

## 📋 Objetivo del Sprint
**Completar todas las funcionalidades MVP restantes, implementar anti-windup, modo chiller, exportación CSV y suite de tests automatizada para lograr un producto completo y pulido.**

## 📊 Información General
- **Duración**: 2 semanas (10 días laborables)
- **Total Story Points**: 18 pts
- **Capacidad estimada**: 18-20 pts
- **Riesgo global**: MEDIO (features adicionales sobre base sólida)

---

## 🎯 Historias de Usuario del Sprint

### H2.3 - Anti-windup Back-calculation (5 pts) - ÉPICA E2
**Como** usuario con SP muy alto  
**Quiero** que el integrador no se sature  
**Para** evitar overshoot excesivo cuando el SP sea alcanzable

#### Descripción detallada
Implementar anti-windup por back-calculation en el controlador PID para prevenir saturación del integrador durante períodos prolongados de saturación de salida. Usar tiempo de tracking auto-calculado según heurística estándar.

#### Criterios de aceptación
- **Dado** un SP que causa saturación prolongada de u (SP=100°C, capacidad<50°C)
- **Cuando** la salida se satura en u=1 por tiempo prolongado (>30s)
- **Entonces** el integrador debe dejar de acumular (anti-windup activo)
- **Y** cuando la saturación termine, la recuperación debe ser suave
- **Y** no debe haber overshoot excesivo (>150% del caso sin saturación)
- **Y** tiempo de tracking debe ser auto-calculado: Tt = sqrt(Ti * Td)
- **Y** debe funcionar en ambas direcciones de saturación (u=0 y u=1)

#### Tareas técnicas
1. Implementar ecuación back-calculation: `I_k += (Ts/Tt)*(u_sat - u_raw)`
2. Calcular tiempo tracking automático: `Tt = sqrt((1/Ki) * Kd)`
3. Detectar saturación de salida y activar anti-windup
4. Validar con casos extremos (SP muy altos/bajos)
5. Comparar overshoot con/sin anti-windup
6. Agregar configuración manual de Tt para usuarios avanzados
7. Documentar ventajas para educación

#### Definition of Done específicos
- [ ] Overshoot reducido >50% en casos de saturación
- [ ] Tt auto-calculado según heurística estándar
- [ ] Funciona en ambas direcciones (u=0, u=1)
- [ ] Recovery suave tras salir de saturación
- [ ] Tests automáticos con casos extremos
- [ ] Configuración Tt manual opcional funcionando

---

### H1.3 - Modo Chiller (3 pts) - ÉPICA E1
**Como** usuario simulando un sistema de enfriamiento  
**Quiero** activar modo Chiller  
**Para** simular procesos donde mayor control significa menor temperatura

#### Descripción detallada
Implementar modo Chiller usando ganancia K negativa en el modelo FOPDT. El comportamiento debe ser simétrico al modo Horno con indicación clara en UI del modo activo.

#### Criterios de aceptación
- **Dado** modo Chiller activado en UI
- **Cuando** incremento la salida de control u de 0.3→0.8
- **Entonces** la temperatura debe decrecer (K < 0 aplicado al modelo)
- **Y** el comportamiento debe ser simétrico al modo Horno
- **Y** la UI debe indicar claramente el modo activo con iconos/colores
- **Y** preset "Chiller compacto" debe funcionar correctamente
- **Y** métricas (overshoot, ts) deben calcularse correctamente

#### Tareas técnicas
1. Modificar modelo FOPDT para aplicar K negativo en modo Chiller
2. Actualizar UI para mostrar modo activo claramente
3. Validar preset "Chiller compacto" (K=-0.04, τ=60s, L=2s)
4. Asegurar métricas funcionan con direcciones invertidas
5. Agregar iconos/indicadores visuales para cada modo
6. Documentar diferencias operacionales para educación
7. Tests automáticos para ambos modos

#### Definition of Done específicos
- [ ] Modo Chiller responde inversamente al Horno
- [ ] UI indica modo activo claramente
- [ ] Preset Chiller funciona correctamente
- [ ] Métricas calculadas correctamente en ambos modos
- [ ] Comportamiento simétrico verificado
- [ ] Tests automáticos para ambos modos

---

### H1.4 - Ruido de Medición (3 pts) - ÉPICA E1
**Como** usuario practicando control con ruido  
**Quiero** agregar ruido gaussiano a la medición  
**Para** simular condiciones reales de medición

#### Descripción detallada
Implementar generador de ruido gaussiano que se aplique únicamente a la medición PV (no al estado interno de la planta). Debe ser configurable, desactivable y tener semilla reproducible.

#### Criterios de aceptación
- **Dado** ruido habilitado con σ = 0.2°C
- **Cuando** ejecuto la simulación
- **Entonces** PV debe tener ruido gaussiano con desviación estándar σ
- **Y** el ruido no debe afectar el estado interno de la planta
- **Y** debo poder desactivar el ruido instantáneamente
- **Y** debe haber opción de semilla para reproducibilidad
- **Y** intensidad debe ser ajustable desde UI (slider)

#### Tareas técnicas
1. Implementar generador ruido gaussiano (Box-Muller transform)
2. Aplicar ruido solo a PV medido, no al estado planta
3. Conectar con control de intensidad en UI
4. Implementar switch on/off instantáneo
5. Agregar semilla configurable para reproducibilidad
6. Validar que filtro derivativo reduce efecto del ruido
7. Documentar uso educativo del ruido

#### Definition of Done específicos
- [ ] Ruido gaussiano con σ configurable aplicado
- [ ] Switch on/off funciona instantáneamente
- [ ] Estado planta no afectado por ruido
- [ ] Semilla reproducible implementada
- [ ] Intensidad ajustable desde UI
- [ ] Derivada filtrada reduce efecto del ruido

---

### H5.1 - Exportar CSV (3 pts) - ÉPICA E5
**Como** usuario analizando datos  
**Quiero** exportar datos de simulación en CSV  
**Para** procesarlos en herramientas externas (Excel, MATLAB, Python)

#### Descripción detallada
Implementar funcionalidad de exportación de datos de simulación en formato CSV estándar con metadatos de configuración. Permitir selección entre ventana visible o historial completo.

#### Criterios de aceptación
- **Dado** simulación con datos acumulados (>100 puntos)
- **Cuando** uso botón "Exportar CSV"
- **Entonces** debe generarse archivo con columnas: t, SP, PV, u, PV_clean
- **Y** debe incluir metadatos (parámetros PID, planta, timestamp)
- **Y** formato debe ser estándar con decimales según locale
- **Y** debe poder elegir "Ventana actual" vs "Todo el historial"
- **Y** exportación debe completarse en <5s para 10K puntos

#### Tareas técnicas
1. Implementar generador CSV con headers y metadatos
2. Crear selector ventana temporal vs historial completo
3. Optimizar exportación para grandes datasets
4. Agregar metadatos de configuración al archivo
5. Validar formato compatible con Excel/MATLAB
6. Implementar progress indicator para exports largos
7. Manejar casos edge (sin datos, simulación pausada)

#### Definition of Done específicos
- [ ] CSV generado con formato estándar correcto
- [ ] Metadatos de configuración incluidos
- [ ] Selector ventana/historial funcionando
- [ ] Exportación <5s para 10K puntos
- [ ] Compatible con Excel y MATLAB
- [ ] Progress indicator para exports largos

---

### H7.1 - Suite Tests Unitarios (4 pts) - ÉPICA E7
**Como** desarrollador  
**Quiero** tests unitarios completos para lógica crítica  
**Para** detectar regresiones rápidamente

#### Descripción detallada
Implementar suite completa de tests unitarios para todos los componentes críticos: modelo FOPDT, controlador PID, calculadora de métricas y comunicación Worker.

#### Criterios de aceptación
- **Dado** lógica de PID, planta, métricas implementada
- **Cuando** ejecuto suite de tests (`pnpm test`)
- **Entonces** cobertura debe ser >= 80% para código crítico
- **Y** tests deben ejecutarse en <30s total
- **Y** deben incluir casos edge y valores límite
- **Y** tests de validación numérica vs casos conocidos
- **Y** tests de integración Worker↔UI básicos

#### Tareas técnicas
1. Setup framework testing (Vitest + Testing Library)
2. Tests unitarios modelo FOPDT (exacta vs analítica)
3. Tests unitarios PID (términos P,I,D + anti-windup)
4. Tests calculadora métricas (overshoot, settling time)
5. Tests comunicación Worker (mensajes tipados)
6. Tests cases edge (parámetros extremos, saturación)
7. Setup CI/CD para ejecutar tests automáticamente

#### Definition of Done específicos
- [ ] Cobertura ≥80% código crítico
- [ ] Suite completa ejecuta en <30s
- [ ] Tests validación numérica incluidos
- [ ] Cases edge cubiertos adequadamente
- [ ] CI/CD ejecuta tests automáticamente
- [ ] Tests de integración Worker básicos

---

## 🎯 Objetivos Medibles del Sprint

### Criterios de Éxito Técnico
- ✅ **Anti-windup efectivo**: Overshoot reducido >50% en casos de saturación
- ✅ **Modo dual funcional**: Horno y Chiller con comportamiento simétrico
- ✅ **Exportación robusta**: CSV compatible con herramientas estándar
- ✅ **Cobertura tests**: ≥80% código crítico con validación numérica

### Criterios de Éxito Funcional
- ✅ **Producto completo**: Todas las features MVP funcionando
- ✅ **Ruido educativo**: Simulación condiciones reales de medición
- ✅ **Datos exportables**: Análisis posterior en herramientas externas
- ✅ **Calidad asegurada**: Tests previenen regresiones

### Criterios de Éxito UX
- ✅ **Experiencia pulida**: Transiciones suaves, feedback claro
- ✅ **Flexibilidad**: Múltiples modos de operación y configuración
- ✅ **Productividad**: Exportación y análisis de datos facilitado

---

## ⚠️ Riesgos del Sprint y Mitigaciones

### 🟡 Riesgo Medio: Anti-windup Requiere Fine-tuning
**Probabilidad**: Media | **Impacto**: Medio
- **Mitigación**: Probar con casos extremos (SP muy altos) desde día 1
- **Plan B**: Implementación simplificada si algoritmo completo falla
- **Indicadores**: Overshoot sigue siendo excesivo después día 5

### 🟢 Riesgo Bajo: Features Adicionales Son Relativamente Simples
**Probabilidad**: Baja | **Impacto**: Bajo
- **Mitigación**: Implementar features simples primero para momentum
- **Plan B**: Postponer features no críticas si hay problemas tiempo
- **Indicadores**: Progreso lento en features de baja complejidad

---

## 📦 Entregables del Sprint

1. **Anti-windup funcionando** - Control robusto con saturación
2. **Modo Chiller completo** - Simulación sistemas de enfriamiento
3. **Ruido gaussiano** - Condiciones reales de medición
4. **Exportación CSV** - Análisis en herramientas externas
5. **Suite tests automatizada** - Calidad y regresiones prevenidas
6. **Release 1.0.0 Production** - Producto completo para adopción masiva

---

## 📈 Métricas de Monitoreo

### Durante el Sprint
- **Daily**: Test coverage y regression status
- **Daily**: Progress en features restantes
- **Semanal**: Integration testing end-to-end

### Al Final del Sprint
- **Sprint Review**: Demo producto completo funcionando
- **Sprint Retrospective**: Lecciones aprendidas del proyecto completo
- **Release 1.0.0**: Lanzamiento con documentación completa

---

## 🔄 Dependencias y Preparación

### Pre-requisitos de Sprints Anteriores
- [x] Discretización exacta validada y estable
- [x] PID con derivada filtrada funcionando
- [x] Métricas overshoot y settling time implementadas
- [x] Comunicación Worker↔UI robusta

### Dependencias externas
- **CI/CD setup**: Pipeline para tests automatizados
- **Documentation review**: Documentación usuario final
- **Beta testing**: Usuarios piloto para feedback

### Preparación requerida
- **Testing framework**: Setup Vitest + Testing Library
- **Export validation**: Verificar compatibilidad Excel/MATLAB
- **Release planning**: Preparación para lanzamiento 1.0.0

---

## 🎓 Valor Educativo Final

Este sprint completa el **valor educativo integral**:
- **Anti-windup**: Enseña limitaciones reales de controladores
- **Modo Chiller**: Amplía comprensión a sistemas de enfriamiento
- **Ruido**: Introduce realismo en condiciones de medición
- **Exportación**: Conecta simulación con análisis profesional
- **Tests**: Demuestra importancia de validación en ingeniería

---

## 🚀 Release 1.0.0 - Production

### Contenido Final
- ✅ Simulador PID educativo completo
- ✅ Precisión matemática validada
- ✅ Interfaz moderna y accesible
- ✅ Exportación datos para análisis
- ✅ Documentación completa
- ✅ Tests automatizados

### Audiencia Objetivo
- **Estudiantes**: Ingeniería de control y instrumentación
- **Instructores**: Herramienta didáctica para clases
- **Ingenieros**: Prototipado y validación de algoritmos
- **Público general**: Aprendizaje autodirigido

### Criterios de Lanzamiento
- [ ] Todas las features MVP funcionando
- [ ] Tests automatizados pasando
- [ ] Documentación usuario completada
- [ ] Performance validado en múltiples navegadores
- [ ] Feedback beta testers incorporado
- [ ] Plan de soporte post-lanzamiento establecido

---

**Responsable Sprint**: Scrum Master  
**Tech Lead**: Lead Developer  
**QA Lead**: Quality Assurance Engineer  
**Release Manager**: DevOps Engineer  
**Revisado por**: Product Owner + Stakeholders  
**Última actualización**: 2024-01-XX
