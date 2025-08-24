# Lógica y Matemática del simulador — **Versión técnica** (programador matemático)

> Alcance: especificación matemática y de la lógica de simulación/control para un sistema térmico tipo horno/chiller en una SPA web. Sin código. Listo para que cualquier implementador traduzca a TS/Worker 1:1.

---

## 1) Variables, unidades y convenciones
- **Tiempo**: continuo `t` [s]; discreto `k ∈ ℕ` con periodo de muestreo `T_s` [s].
- **Temperatura**: `T(t)` [°C]; **ambiental** `T_amb` [°C]; **medida** `PV_k` [°C].
- **Entrada de control**: `u` adimensional. Convención horno: `u ∈ [0,1]` (0%–100%). Modo chiller (recomendado): **ganancia efectiva negativa** `K<0` y `u ∈ [0,1]`.
- **Setpoint**: `SP_k` [°C].
- **Disturbio equivalente**: `d(t)` [°C/s] (aporte térmico por unidad de tiempo) → discreto `d_k`.
- **Ruido de medición**: `n_k ~ 𝒩(0, σ²)` [°C].

> Notación centrada: `x := T − T_amb` [°C].

---

## 2) Modelo de planta (FOPDT) y discretización
### 2.1 Forma continua (estado centrado)
```
 dx/dt = −(1/τ)·x(t) + K·u(t − L) + d(t)
 y(t)  = x(t) + T_amb
```
Parámetros: `τ>0` (constante de tiempo [s]), `K` (ganancia efectiva [°C/s por unidad de `u`]), `L≥0` (tiempo muerto [s]).

**Ganancia estática** (relación `u` → `y` en régimen permanente, `d=0`):
```
 y_ss − T_amb = x_ss = τ·K · u
 => G_0 = ∂y_ss/∂u = τ·K  [°C / unidad u]
```

### 2.2 Discretización exacta del 1er orden (recomendada)
Para `d` por tramos constantes en cada paso y `u` mantenida por tramo (excepto el retardo):
```
 a = exp(−T_s/τ)
 b = τ·K · (1 − a)
 b_d = τ · (1 − a)

 x_{k+1} = a·x_k + b·u_{k−L_s} + b_d·d_k
 y_k = x_k + T_amb
```
`L_s = ceil(L/T_s)` (retardo en **muestras**; implementar con FIFO sobre `u`).

> Esta forma evita errores numéricos del Euler explícito y mantiene estabilidad para cualquier `T_s>0`.

### 2.3 Alternativa: Euler hacia adelante (si se prefiere)
```
 x_{k+1} = x_k + T_s · [ K·u_{k−L_s} + d_k − x_k/τ ]
```
**Condición de estabilidad numérica** (lineal, sin retardo): `T_s < 2·τ`. Para precisión, `T_s ≤ τ/20`.

### 2.4 Retardo puro (tiempo muerto)
- Se modela con **cola FIFO** `U[k]` de longitud `L_s`. En cada `k`, usar `u_{k−L_s}`.
- Si `L/T_s` no es entero, `ceil` introduce un error de ±`T_s/2`. Si se requiere sub‐muestra, interpolar linealmente `u`.

### 2.5 Ruido y medida
```
 PV_k = y_k + n_k,     n_k ~ 𝒩(0, σ²)
```
Opcional: filtro de medición de 1er orden `PVf_k = α·PVf_{k−1} + (1−α)·PV_k`, `α = exp(−T_s/τ_m)`.

---

## 3) Perturbaciones
### 3.1 Paso de carga
- **Amplitud** `D_amp` [°C/s], **duración** `D_dur` [s].
- Implementación: `d_k = D_amp` para `k ∈ [k_0, k_0 + ⌊D_dur/T_s⌋)`, y `0` fuera.
- Guía: `D_amp ≈ 0.2–0.5 · K` produce efectos visibles sin saturación extrema.

### 3.2 Otros
Escalonamiento de `T_amb` o drift lento puede modelarse como `T_amb_k = T_amb + Δ·(k·T_s)`.

---

## 4) Control PID (paralelo, derivada en la medida, anti‑windup)
### 4.1 Estructura discreta
Error: `e_k = SP_k − PV_k` (si se filtra medición, usar `PVf_k`).

**Integral** (rectangular + back‑calculation):
```
 I_k = I_{k−1} + K_i·T_s·e_k + (T_s/T_t) · (u_k − u_k^{raw})
```
`K_i` [s⁻¹], `T_t` [s] tiempo de rastreo (tracking); típico `T_t ∈ [1/K_i, 10/K_i]`. Si `u` no satura, el término de seguimiento es 0.

**Derivada filtrada sobre la medida** (1er orden):
```
 τ_d: tiempo derivativo [s]
 τ_f: tiempo de filtro [s]  (típico τ_f = τ_d / N, N∈[5,20])
 α = τ_f / (τ_f + T_s)
 D_k = α·D_{k−1} + (1−α) · (τ_d/T_s) · (PV_k − PV_{k−1})
```

**Salida no saturada y saturada**:
```
 u_k^{raw} = K_p·e_k + I_k − D_k
 u_k = sat(u_k^{raw}; u_min, u_max)
```
- Horno: `u_min=0`, `u_max=1`.
- Chiller (con `K<0`): igual rango `[0,1]` (el signo lo aporta `K`).

**Clamps de integrador** (si se prefiere al back‑calculation): `I_k ← clip(I_k, I_min, I_max)` con `I_min/I_max` coherentes con `u`.

### 4.2 Unidades y tuning base
- `K_p` adimensional, `K_i` [s⁻¹], `τ_d` [s]. (Si se usa `K_d`, `K_d ≡ τ_d` en esta forma.)
- Heurística de arranque: subir `K_p` hasta borde de oscilación, `K_i` para abatir error estacionario (evitar oscilación sostenida), `τ_d` para reducir sobrepaso; `N=10`.

---

## 5) SSR (time‑proportioning) y potencia efectiva
- **Control por ventana**: periodo `T_w` [s], duty `u_k`.
- **Modelo equivalente recomendado**: usar `u_k` como **potencia media** en la planta (evita aliasing y ciclos límite con `T_w` grande).
- Si se requiere **conmutación explícita** para visual, definir `g(t) ∈ {0,1}` tal que en cada ventana `∫ g = u·T_w`, pero **integrar la planta con paso más fino** (`T_s` ≪ `T_w`) para consistencia.

---

## 6) Métricas de desempeño
### 6.1 Overshoot (porcentaje)
Sea `SP*` el valor objetivo vigente tras el último cambio de SP o `Reset` y `PV_max` el máximo observado desde ese instante:
```
 Overshoot[%] = 100 · max(0, (PV_max − SP*) / |SP*| )
```
Si `SP* = 0`, reportar en [°C] o usar umbral mínimo (>0) para normalizar.

### 6.2 Tiempo de establecimiento `t_s` (banda ±2%)
Definir banda `ℬ = [SP* − 0.02·|SP*|, SP* + 0.02·|SP*|]`. Se busca el primer `t_k` tal que `PV_j ∈ ℬ, ∀ j ∈ [k, k+H)`, con `H = ⌈t_hold/T_s⌉` (p. ej., `t_hold=5 s`). Entonces `t_s = t_k − t_0` (siendo `t_0` el instante del cambio de SP/Reset). Si no se cumple en el horizonte, `t_s = NaN`.

### 6.3 (Opcional) Métricas integrales
`IAE = Σ T_s·|e_k|`, `ISE = Σ T_s·e_k²`, `RMSE = sqrt( (1/N)·Σ e_k² )` sobre ventanas seleccionadas.

---

## 7) Arquitectura computacional de simulación
- **Bucle en Web Worker** a `T_s` fijo (recomendado `T_s=0.1 s`, 10 Hz). Reloj: `performance.now()` o `Atomics.wait`‐based ticks. Evitar drift usando acumulador de error: `t_next ← t_next + T_s` y dormir hasta `t_next`.
- **Estado mínimo** por paso: `x_k`, `I_k`, `D_k`, colas FIFO para `u` (retardo) y para métricas (detectar `PV_max`, banda de `t_s`). O(1) en tiempo y memoria, salvo buffers de retardo e historial.
- **Historial**: buffer circular maestro con capacidad ≥ `max(ventana visible, ventana exportación)`.
- **Comunicación UI⇄Worker**: mensajes con deltas de parámetros y muestras (`{t, SP, PV, u, flags}`), idempotentes. (El contrato exacto se define en otro anexo.)

---

## 8) Límites, clamps y salud numérica
- **Rangos** sugeridos (coinciden con la UI):
  - `SP: 0–200 °C`, `K: [−0.10, 0.10]` (modo chiller usa `K<0`), `τ: 1–600 s`, `L: 0–15 s`, `T_amb: 10–35 °C`.
  - `K_p: 0–10`, `K_i: 0–1 s⁻¹`, `τ_d: 0–200 s`, `N: 5–20`.
- **Saturaciones**: `u ∈ [0,1]`. En derivada filtrada, manejar saltos grandes de `PV` (limiting) para evitar picos numéricos.
- **NaNs/Infs**: sanear entradas UI; validar `τ>0`, `T_s>0`. Clampear `PV` para visualización p.ej. `[-50, 300] °C`.
- **Retardo**: si `L_s` cambia dinámicamente, rellenar la FIFO con el borde (último valor) para evitar discontinuidades.

---

## 9) Presets y consistencia con la UI
- **Horno lento**: `K=+0.015`, `τ=180 s`, `L=5 s`, `T_amb=25 °C`; ejemplo inicial `K_p=2.00`, `K_i=0.10 s⁻¹`, `τ_d=10 s`.
- **Horno medio**: `K=+0.03`, `τ=90 s`, `L=3 s`, `T_amb=25 °C`; mismos PID base.
- **Chiller compacto**: `K=−0.04`, `τ=60 s`, `L=2 s`, `T_amb=25 °C`; mismos PID base.

> Nota: estas `K` son **efectivas** (por segundo). La ganancia estática equivalente es `G_0=τ·K` (°C/
unidad). Ajustarlas para que `u∈[0,1]` produzca rangos de temperatura realistas.

---

## 10) Validación y pruebas numéricas
- **Caso analítico (L=0, d=0, `u` escalón)**:
```
 x(t) = x(0)·e^{−t/τ} + τ·K·u·(1 − e^{−t/τ})
 y(t) = x(t) + T_amb
```
Comparar con la discretización exacta (2.2); los perfiles deben coincidir a error de redondeo.

- **Retardo**: para `L>0`, verificar desplazamiento temporal ≈ `L` antes del ascenso.
- **Disturbio**: inyectar `D_amp` a los 60 s; observar corrección del PID y overshoot.
- **Ruido**: crecer `σ` y verificar que la derivada filtrada no induzca chatter en `u`.

---

## 11) Coste computacional
- Por paso: O(1) (constantes: 1 exp precalculada para `a`, unas pocas sumas/multipl.). Historial y FIFO dominan memoria: O(`L_s + N_hist`).
- Recomendación: precomputar `a,b,b_d` cuando cambie `τ` o `T_s`.

---

## 12) Criterios de aceptación de la lógica (DoD)
- Implementación de planta **discreta exacta** (2.2) con retardo FIFO.
- PID con derivada filtrada (4.1), anti‑windup por back‑calculation y saturación `u∈[0,1]`.
- Métricas `Overshoot` y `t_s` calculadas según §6 con reinicio tras cambios de `SP`/`Reset`.
- Bucle a `T_s=0.1 s` sin drift apreciable; exportación coherente con el historial.
- Consistencia de signado en modo chiller (`K<0`).

---

## 13) Apéndice: equivalencias de formas PID
- **Forma “ISA”** (ideal): `u = K_c [ e + (1/T_i) ∫ e dt + T_d de/dt ]`.
  - Equivalencias: `K_p = K_c`, `K_i = K_c/T_i`, `τ_d = T_d`.
- **Derivada filtrada**: `G_d(s) = (T_d s) / (1 + T_f s)` con `T_f = T_d/N`.
- **Back‑calculation**: `İ = K_i e + (1/T_t)(u − u_raw)` ⇒ discreto §4.1.

> Con esto, puedes mapear parámetros procedentes de literatura/reglas de tuning a esta implementación.

