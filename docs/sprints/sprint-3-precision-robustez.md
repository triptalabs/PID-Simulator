# SPRINT 3: "Precisión y Robustez" (Semanas 5-6)

## 📋 Objetivo del Sprint
**Mejorar la precisión numérica del simulador implementando discretización exacta, derivada filtrada y tiempo de establecimiento, alcanzando calidad educativa profesional.**

## 📊 Información General
- **Duración**: 2 semanas (10 días laborables)
- **Total Story Points**: 18 pts
- **Capacidad estimada**: 18-20 pts
- **Riesgo global**: ALTO (cambios matemáticos críticos y validación numérica)

---

## 🎯 Historias de Usuario del Sprint

### H1.2 - Discretización Exacta (8 pts) - ÉPICA E1
**Como** desarrollador del simulador  
**Quiero** usar discretización matemáticamente exacta  
**Para** garantizar estabilidad numérica en simulaciones largas

#### Descripción detallada
Migrar de discretización Euler hacia adelante a discretización exacta basada en solución analítica del modelo FOPDT. Esto garantiza estabilidad incondicional y precisión matemática exacta para cualquier paso de tiempo.

#### Criterios de aceptación
- **Dado** cualquier T_s > 0 válido (0.01s a 1.0s)
- **Cuando** ejecuto simulación por 1+ horas continuas
- **Entonces** no debe haber drift numérico apreciable (<0.01°C/hora)
- **Y** la respuesta debe coincidir con solución analítica (L=0) con error <0.1%
- **Y** debe ser estable independiente del valor de T_s/τ
- **Y** ganancia estática debe ser exactamente τ·K (error <0.01%)
- **Y** migración no debe romper funcionalidad existente

#### Tareas técnicas
1. Implementar discretización exacta: `a = exp(-Ts/τ)`, `b = τ·K·(1-a)`
2. Crear tests de regresión para validar migración
3. Comparar Euler vs Exacta con casos de prueba estándar
4. Implementar validación automática vs solución analítica
5. Optimizar cálculo de exponencial (precompute cuando cambia τ)
6. Documentar diferencias matemáticas para educación
7. Mantener Euler como fallback opcional (flag debug)

#### Definition of Done específicos
- [ ] Error vs solución analítica <0.1% para L=0
- [ ] Simulación estable por 2+ horas sin drift
- [ ] Ganancia estática exacta (error <0.01%)
- [ ] Migration tests pasan al 100%
- [ ] Performance igual o mejor que Euler
- [ ] Documentación matemática actualizada

---

### H2.2 - Derivada Filtrada (5 pts) - ÉPICA E2
**Como** ingeniero sintonizando controladores  
**Quiero** derivada filtrada para reducir ruido  
**Para** evitar salidas de control erráticas con ruido de medición

#### Descripción detallada
Implementar derivada filtrada de primer orden calculada sobre la medición PV (no sobre error) para eliminar kick derivativo y reducir amplificación de ruido. Usar factor N configurable para ajustar el filtrado.

#### Criterios de aceptación
- **Dado** Kd > 0 y ruido habilitado con σ = 0.2°C
- **Cuando** hay ruido en la medición PV  
- **Entonces** la salida de control no debe oscilar excesivamente (±5% máximo)
- **Y** el filtro debe usar factor N configurable (default N=10)
- **Y** la derivada debe calcularse sobre PV, no sobre error
- **Y** no debe haber kick derivativo en cambios de setpoint
- **Y** debe mantener efectividad derivativa en respuesta normal

#### Tareas técnicas
1. Modificar PIDController para derivada sobre PV
2. Implementar filtro 1er orden: `τf = Kd/N`, `α = τf/(τf + Ts)`
3. Eliminar kick derivativo completamente
4. Agregar factor N configurable en UI (rango 5-20)
5. Validar reducción de ruido con tests automáticos
6. Comparar respuesta con/sin filtro para educación
7. Documentar ventajas técnicas del filtro

#### Definition of Done específicos
- [ ] Zero kick derivativo en cambios SP
- [ ] Ruido reducido factor >5x con N=10
- [ ] Factor N configurable en UI funcionando
- [ ] Respuesta derivativa normal mantenida
- [ ] Tests automáticos validando filtro
- [ ] Documentación diferencias filtrado/sin filtrar

---

### H4.2 - Tiempo de Establecimiento (5 pts) - ÉPICA E4
**Como** ingeniero evaluando performance  
**Quiero** ver tiempo de establecimiento ts (±2%)  
**Para** cuantificar qué tan rápido el sistema alcanza régimen permanente

#### Descripción detallada
Implementar algoritmo de cálculo automático de tiempo de establecimiento usando criterio ±2% con tiempo de hold configurable. Debe reiniciarse automáticamente tras cambios significativos de setpoint.

#### Criterios de aceptación
- **Dado** respuesta a escalón de SP de 25°C→60°C
- **Cuando** PV entra en banda ±2% del SP (58.3°C - 61.7°C)
- **Entonces** debe iniciarse conteo de tiempo de hold (default 5s)
- **Y** si PV sale de la banda, debe reiniciarse el conteo
- **Y** ts debe mostrarse solo cuando se confirme establecimiento
- **Y** debe reiniciarse automáticamente con cambios SP >5%
- **Y** debe manejar transiciones negativas correctamente

#### Tareas técnicas
1. Extender MetricsCalculator con algoritmo settling time
2. Implementar detector de banda ±2% configurable
3. Implementar contador de hold time con reset
4. Manejar casos edge: oscilaciones, reversiones
5. Integrar con UI mostrando ts en tiempo real
6. Validar contra casos conocidos de literatura
7. Agregar configuración de banda % (1%, 2%, 5%)

#### Definition of Done específicos
- [ ] ts calculado ±10% vs casos teóricos conocidos
- [ ] Reset automático funciona tras cambio SP
- [ ] Hold time configurable y funcional
- [ ] Maneja oscilaciones sin falsos positivos
- [ ] UI muestra ts claramente cuando válido
- [ ] Tests con casos de literatura standard

---

## 🎯 Objetivos Medibles del Sprint

### Criterios de Éxito Técnico
- ✅ **Precisión matemática**: Error vs analítico <0.1% en todos los casos
- ✅ **Estabilidad numérica**: Simulación 2+ horas sin drift apreciable
- ✅ **Filtrado efectivo**: Ruido reducido >5x con derivada filtrada
- ✅ **Métricas precisas**: ts calculado ±10% vs literatura

### Criterios de Éxito Funcional
- ✅ **Discretización robusta**: Estable con cualquier Ts/τ ratio válido
- ✅ **Control suave**: Sin kick derivativo ni oscilaciones por ruido
- ✅ **Métricas completas**: Overshoot + ts automáticos y precisos

### Criterios de Éxito Educativo
- ✅ **Comportamiento realista**: Coincide con controladores industriales
- ✅ **Precisión confiable**: Resultados validables vs teoría
- ✅ **Herramienta profesional**: Utilizable para prototipado real

---

## ⚠️ Riesgos del Sprint y Mitigaciones

### 🔴 Riesgo Alto: Cambio de Discretización Introduce Bugs
**Probabilidad**: Media | **Impacto**: Alto
- **Mitigación**: Tests de regresión exhaustivos antes del cambio
- **Plan B**: Rollback a Euler si se detectan problemas críticos
- **Indicadores**: Fallas en tests existentes tras migración

### 🟡 Riesgo Medio: Cálculo ts Requiere Lógica Compleja
**Probabilidad**: Media | **Impacto**: Medio
- **Mitigación**: Implementar con casos simples primero, incrementar complejidad
- **Plan B**: Versión simplificada sin hold time como fallback
- **Indicadores**: Dificultades con casos edge después día 5

### 🟢 Riesgo Bajo: Performance Degradada por Filtro
**Probabilidad**: Baja | **Impacto**: Bajo
- **Mitigación**: Optimizar cálculos y precomputar constantes
- **Plan B**: Filtro opcional si impacta performance significativamente

---

## 📦 Entregables del Sprint

1. **Discretización exacta validada** - Precisión matemática garantizada
2. **Derivada filtrada funcionando** - Control robusto con ruido
3. **Tiempo de establecimiento automático** - Métrica completa implementada
4. **Suite de validación numérica** - Tests vs literatura y casos analíticos
5. **Documentación precisión** - Explicación técnica de mejoras
6. **Release 0.2.0 Beta** - Versión con precisión profesional

---

## 📈 Métricas de Monitoreo

### Durante el Sprint
- **Daily**: Tests de validación numérica status
- **Daily**: Performance benchmarks vs Sprint anterior
- **Semanal**: Validación vs casos de literatura

### Al Final del Sprint
- **Sprint Review**: Demo precisión vs herramientas comerciales
- **Sprint Retrospective**: Lecciones sobre validación numérica
- **Métricas técnicas**: Cumplimiento criterios precisión

---

## 🔄 Dependencias y Preparación

### Pre-requisitos de Sprints Anteriores
- [x] Web Worker estable y robusto
- [x] Modelo FOPDT básico funcionando
- [x] PID básico con términos separados
- [x] Comunicación Worker↔UI establecida

### Dependencias externas
- **Literatura técnica**: Casos de validación estándar
- **Herramientas de comparación**: MATLAB/Simulink para benchmarking
- **Expertise matemático**: Consulta para validación algoritmos

### Preparación requerida
- **Research discretización**: 1 día revisión ADR-0001
- **Setup benchmarking**: Herramientas para comparar vs literatura
- **Casos de prueba**: Recopilación de casos estándar conocidos

---

## 🎯 Validación Numérica Específica

### Casos de Prueba Obligatorios

#### Caso 1: Step Response (L=0)
```yaml
Parámetros: K=0.03, τ=90s, L=0, T_amb=25°C
Input: Escalón u=0.5 en t=5s
Expectativa: Coincidencia exacta con T_amb + τ·K·u·(1-e^(-t/τ))
Tolerancia: Error <0.1%
```

#### Caso 2: Time Delay Validation
```yaml
Parámetros: K=0.02, τ=60s, L=3s, T_amb=20°C  
Input: Escalón u=1.0 en t=10s
Expectativa: Inicio respuesta en t=13.0±0.1s
Tolerancia: Delay error ±0.1s
```

#### Caso 3: Settling Time Standard
```yaml
Parámetros: Proceso estándar + PID Ziegler-Nichols
Input: Escalón SP 25°C→65°C
Expectativa: ts según literatura para parámetros dados
Tolerancia: ±15% vs valor teórico
```

---

## 🧪 Definition of Done Técnica Específica

### Código
- [ ] Discretización exacta implementada según ADR-0001
- [ ] Derivada filtrada sobre PV (no error) funcionando
- [ ] Settling time con hold time configurable
- [ ] Migration tests al 100% success rate
- [ ] Performance ≥ implementación anterior

### Validación
- [ ] Error vs solución analítica <0.1%
- [ ] Validación vs 3+ casos de literatura
- [ ] Estabilidad 2+ horas verificada
- [ ] Filtro reduce ruido >5x demonstrado
- [ ] ts calculado ±15% vs valores teóricos

### Documentación
- [ ] ADRs actualizados con decisiones implementadas
- [ ] Casos de validación documentados
- [ ] Diferencias vs implementación anterior explicadas
- [ ] Guide para validar precisión incluido

---

**Responsable Sprint**: Scrum Master  
**Tech Lead**: Lead Developer  
**Mathematical Validation**: Control Systems Expert  
**Revisado por**: Product Owner + Technical Advisor  
**Última actualización**: 2024-01-XX
