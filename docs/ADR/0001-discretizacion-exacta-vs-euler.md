# ADR-0001: Discretización Exacta vs Euler para Modelo FOPDT

## Estado
**Aceptado** - Fecha: 2024-01-XX

## Contexto
El simulador PID requiere discretizar la ecuación diferencial del modelo FOPDT (First Order Plus Dead Time) para ejecutar en tiempo real a T_s = 100ms. Existen dos enfoques principales para esta discretización:

1. **Euler hacia adelante** (Forward Euler)
2. **Discretización exacta** (basada en solución analítica)

La ecuación continua del modelo FOPDT centrado es:
```
dx/dt = -(1/τ)·x(t) + K·u(t-L) + d(t)
y(t) = x(t) + T_amb
```

## Decisión
**Seleccionamos discretización exacta como método principal**, con fallback opcional a Euler para casos específicos.

## Alternativas Consideradas

### Opción 1: Euler hacia adelante
```
x_{k+1} = x_k + T_s · [K·u_{k-L_s} + d_k - x_k/τ]
```

**Pros:**
- ✅ Implementación simple y directa
- ✅ Intuitivo de entender y debuggear
- ✅ Fácil de extender a modelos más complejos
- ✅ Ampliamente conocido y documentado

**Contras:**
- ❌ **Inestabilidad numérica** para T_s >= 2τ
- ❌ Errores de discretización acumulativos
- ❌ Requiere validación cuidadosa de condiciones de estabilidad
- ❌ Deriva en simulaciones largas

### Opción 2: Discretización exacta
```
a = exp(-T_s/τ)
b = τ·K·(1-a)  
b_d = τ·(1-a)
x_{k+1} = a·x_k + b·u_{k-L_s} + b_d·d_k
```

**Pros:**
- ✅ **Estabilidad incondicional** para cualquier T_s > 0
- ✅ **Precisión matemática exacta** (coincide con solución analítica)
- ✅ Sin drift en simulaciones de larga duración
- ✅ Mejor comportamiento con parámetros extremos
- ✅ Validación trivial contra casos conocidos

**Contras:**
- ❌ Cálculo de exponencial más costoso computacionalmente
- ❌ Menos intuitivo para desarrolladores
- ❌ Específico para sistemas de 1er orden

### Opción 3: Híbrida (Rechazada)
Usar Euler para desarrollo rápido y migrar a exacta después.

**Razón del rechazo**: Introduce complejidad de mantener dos implementaciones y riesgo de regresiones durante migración.

## Justificación Detallada

### 1. Estabilidad Numérica
La estabilidad es **crítica** para un simulador educativo. Con Euler:
- Para τ = 1s y T_s = 0.1s → ratio = 0.1 ✅ (estable)
- Para τ = 60s y T_s = 0.1s → ratio = 0.0017 ✅ (estable pero potencial drift)
- Para τ = 600s y T_s = 0.1s → ratio = 0.00017 ⚠️ (drift significativo)

Con discretización exacta, **todos los casos son estables** independientemente del ratio T_s/τ.

### 2. Precisión Educativa
Para un simulador educativo es fundamental que:
- Los resultados coincidan con la teoría
- Los estudiantes puedan validar manualmente los cálculos
- No haya "sorpresas" numéricas que confundan el aprendizaje

La discretización exacta garantiza que la respuesta escalón será **idéntica** a la fórmula analítica clásica.

### 3. Validación y Testing
Con discretización exacta:
```javascript
// Test case trivial - L=0, escalón unitario
const expected = T_amb + tau * K * u * (1 - Math.exp(-t/tau))
const simulated = plant.step(u, 0)
assert(Math.abs(simulated - expected) < 1e-10)
```

Este tipo de validación es **imposible** con Euler debido a errores inherentes.

### 4. Performance Analysis
**Costo computacional por paso**:
- Euler: 3 operaciones aritméticas
- Exacta: 1 exponencial + 3 operaciones aritméticas

**Optimización**: Precomputar `a`, `b`, `b_d` cuando cambian τ o T_s:
```javascript
class PlantModel {
  private updateCoefficients() {
    this.a = Math.exp(-this.T_s / this.tau)
    this.b = this.tau * this.K * (1 - this.a)
    this.b_d = this.tau * (1 - this.a)
  }
  
  step(u: number, d: number): number {
    // Solo 3 operaciones por paso
    this.x = this.a * this.x + this.b * this.u_delayed + this.b_d * d
    return this.x + this.T_amb
  }
}
```

**Costo real**: ~1μs adicional por paso, **irrelevante** comparado con otros overhead del Worker.

### 5. Casos Límite
**τ → 0** (sistema muy rápido):
- Euler: Requiere T_s → 0 para estabilidad
- Exacta: `a → 0`, `b → T_s·K`, comportamiento correcto

**τ → ∞** (integrador puro):
- Euler: `x_{k+1} ≈ x_k + T_s·K·u` ✅
- Exacta: `a → 1`, `b → T_s·K` ✅ (idéntico)

**T_s → 0**:
- Ambos convergen al sistema continuo ✅

## Implementación

### Arquitectura Propuesta
```typescript
interface DiscretizationMethod {
  update(x: number, u: number, d: number): number
  updateParams(K: number, tau: number, T_s: number): void
}

class ExactDiscretization implements DiscretizationMethod {
  private a: number = 0
  private b: number = 0  
  private b_d: number = 0
  
  updateParams(K: number, tau: number, T_s: number) {
    this.a = Math.exp(-T_s / tau)
    this.b = tau * K * (1 - this.a)
    this.b_d = tau * (1 - this.a)
  }
  
  update(x: number, u: number, d: number): number {
    return this.a * x + this.b * u + this.b_d * d
  }
}

class EulerDiscretization implements DiscretizationMethod {
  // Fallback implementation
}
```

### Plan de Migración
1. **Sprint 1**: Implementar discretización exacta como default
2. **Sprint 2**: Agregar validación exhaustiva vs casos analíticos  
3. **Sprint 3**: Implementar Euler como fallback opcional (flag debug)
4. **Post-release**: Remover Euler si no es necesario

### Criterios de Validación
```javascript
describe('Exact Discretization Validation', () => {
  test('matches analytical solution for step response', () => {
    const plant = new PlantModel({ K: 0.02, tau: 60, L: 0 })
    
    // Simulate for 5*tau seconds
    for (let t = 0; t <= 300; t += 0.1) {
      const y_sim = plant.step(1.0, 0)
      const y_analytical = 25 + 60 * 0.02 * 1.0 * (1 - Math.exp(-t/60))
      
      expect(Math.abs(y_sim - y_analytical)).toBeLessThan(1e-10)
    }
  })
})
```

## Consecuencias

### Positivas
- ✅ **Estabilidad garantizada** para todos los parámetros válidos
- ✅ **Validación trivial** contra literatura y casos conocidos
- ✅ **Confianza educativa** en resultados numéricos
- ✅ **Simplicidad de testing** con oráculos exactos
- ✅ **Robustez** para simulaciones de larga duración

### Negativas  
- ❌ **Complejidad conceptual** ligeramente mayor
- ❌ **Especificidad** a sistemas de 1er orden (no extensible)
- ❌ **Costo computacional** mínimo adicional

### Riesgos Mitigados
- **R-T001 (Inestabilidad numérica)**: Significativamente reducido
- **R-Q001 (Validación insuficiente)**: Facilitada por oráculos exactos

### Nuevos Riesgos
- **Implementación incorrecta** de exponencial (mitigado por testing)
- **Overflow** en casos extremos (mitigado por clamps de entrada)

## Métricas de Éxito
- [ ] Error vs solución analítica < 1e-8 para casos L=0
- [ ] Simulación estable por 8+ horas continuas  
- [ ] Ganancia estática exacta: error < 0.01%
- [ ] Sin regresión de performance: overhead < 5%

## Referencias
1. Franklin, G.F., et al. "Digital Control of Dynamic Systems" - Capítulo sobre discretización
2. Åström, K.J. "Computer-Controlled Systems" - Sección de métodos exactos
3. Documentación matemática del proyecto: `docs/logica_y_matematica_version_tecnica_programador_matematico.md`

## Revisiones
- **v1.0**: Decisión inicial (2024-01-XX)
- **v1.1**: Actualización post-implementación (TBD)
