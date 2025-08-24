# Brief funcional del **Simulador PID — Horno/Chiller** (UI ya existente)

## 1) Propósito

- **Objetivo**: una app web que simule, en tiempo real, la respuesta térmica de un **horno** o un **chiller** frente a un **setpoint** usando un **controlador PID** ajustable desde la UI (sliders).
- **Para qué sirve**: probar y enseñar control PID sin tocar hardware, afinar ganancias antes de flashear el ESP32 y explicar métricas clave (overshoot y tiempo de establecimiento) con curvas claras.

## 2) Alcance funcional (lo que debe hacer)

- **Pantalla única (dashboard)** con:
  - Panel izquierdo de **controles** (modo, setpoint, PID, planta, ruido/disturbios, presets, SSR por ventana, acciones).
  - Panel derecho con **dos métricas** (Overshoot % y **tₛ ±2%**) y **dos gráficas**:
    - **PV vs SP** (temperatura de proceso vs setpoint).
    - **Salida del PID (%)**.
  - **Selector de ventana temporal**: 30 s / 60 s / 300 s (afecta el rango visible de ambas gráficas).
- **Controles y comportamiento esperados**:
  - **Modo**: Horno / Chiller.
  - **Setpoint (°C)**: slider + input numérico sincronizados.
  - **Ganancias PID**: Kp, Ki (s⁻¹), Kd (s) con sliders e inputs sincronizados.
  - **Planta (avanzado)**: K, τ (s), L (s), T\_amb (°C) en acordeón.
  - **Ruido / Disturbios**: switch de ruido + slider de intensidad; botón “Paso de carga” que aplica un disturbio tipo escalón.
  - **Presets**: Horno lento / Horno medio / Chiller compacto (cargan valores en los controles).
  - **SSR por ventana (opcional)**: al activarse muestra slider de **Periodo (s)**.
  - **Acciones**: Iniciar/Pausar (toggle), Reset, Exportar CSV (cuando esté implementada la lógica).
- **Texto/estilo**: idioma **Español**, **tema oscuro** por defecto, accesible (labels, tooltips, foco visible).
- **Nota**: la UI ya existe; esto define la **lógica** para completarla.

## 3) Modelo de la planta (proceso térmico)

- **Modelo base**: **FOPDT** (Primer Orden + Tiempo Muerto).
  - Temperatura del proceso `T` en °C.
  - **Ecuación continua (intuición)**:
    ```
    dT/dt = [K · u(t-L) + d(t) - (T - T_amb)] / τ
    ```
    Donde:
    - `K`: ganancia térmica efectiva (°C/s por % de mando).
    - `τ`: constante de tiempo (s).
    - `L`: tiempo muerto (s).
    - `u`: salida normalizada del controlador (0–1 típico).
    - `d(t)`: disturbio (entrada aditiva).
- **Discretización (simulación)**: paso fijo **Δt = 100 ms** (recomendado) con Euler hacia adelante.
- **Tiempo muerto**: buffer circular de longitud `L_s = ceil(L/Δt)` aplicado a `u`.
- **Ruido**: gaussiano sobre la **medida** (PV), con desviación `σ` controlada por el slider.
- **Disturbio “Paso de carga”**: incremento/decremento aditivo `D` durante una duración configurable (por defecto 10 s).
- **Modo Chiller** (elige una y sé consistente):
  1. **K negativo** (misma `u∈[0,1]`) ⇒ el proceso enfría cuando `u` sube. **(Recomendada)**
  2. ``** con signo** (`u∈[-1,1]`) y `K` positivo ⇒ valores negativos “extraen calor”.

## 4) Controlador PID (paridad con el firmware)

- **Forma posicional** con:
  - **Error** `e = SP - PV`.
  - **Integral** con anti-windup (clamp o back-calculation).
  - **Derivada sobre la medida** (filtro 1er orden configurable con factor **N** opcional).
  - **Saturación** de salida `u` en `[0,1]` (Horno). En Chiller, si se usa `K` negativo, se mantiene `[0,1]`.
- **Unidades**:
  - `Kp` adimensional.
  - `Ki` en `s⁻¹` (integración multiplicada por `Δt`).
  - `Kd` en `s` (derivada dividida por `Δt` y filtrada).
- **Funciones esperadas (mirror del ESP32)**:
  - `pid_set_gains(kp, ki, kd)`
  - `pid_enable(bool)` / `pid_reset()`
  - `pid_compute(sp, pv, dt) -> u`
- **Límites y salud**:
  - Clamp de `u` a `[0,1]` (o `[-1,1]` si se usa `u` con signo).
  - Integrador con **clamp simétrico** para evitar windup (rango configurable).
  - Arranque con `PV = T_amb`, integrador a 0, derivada a 0.

## 5) Actuación: **SSR por ventana** (opcional)

- **Concepto**: modulación por tiempo (time-proportioning) con **periodo** configurable (0.5–10 s).
- **Implementación de simulación**:
  - Para **estabilidad y suavidad**, usar **potencia media equivalente**: `u_SSR = duty ∈ [0,1]`.
  - (Opcional visual) un preview de pulso para ilustrar el duty dentro del periodo.
- **Si más adelante se conecta a hardware**, el mismo duty gobierna el ciclo on/off real.

## 6) Métricas y cálculo de indicadores

- **Overshoot (%)**: `max(0, (T_max - SP)/SP) × 100`. Se evalúa después del último cambio de `SP` o de “Reset”.
- **tₛ (±2%)**: primer instante en que `PV` entra a `[SP ± 2%]` **y permanece** dentro del rango por un **tiempo de verificación** (p. ej. 5 s).
- **Reinicio de métricas**: al **Reset**, al aplicar **Presets** o al cambiar significativamente `SP`.

## 7) Lazo de simulación

- **Web Worker** dedicado:
  - Bucle a **Δt fijo** (100 ms) con reloj monotónico.
  - Recibe **comandos** desde la UI (cambios de sliders, presets, iniciar/pausar, reset).
  - Emite **muestras** con timestamp, `SP`, `PV`, `u`, y valores para indicadores.
- **UI/Gráficas**:
  - Render con `requestAnimationFrame`.
  - **Ventana temporal** seleccionable (30/60/300 s) con buffer circular maestro (p. ej., guardar 10–20 min para exportar).
  - **Downsampling** ligero para no afectar FPS en móviles.

## 8) Exportación y persistencia

- **Exportar CSV**: columnas `t(s), SP, PV, u(%)`. Exporta la **ventana visible** o **toda la corrida** (configurable).
- **Persistencia local** (opcional): guardar en `localStorage` el último perfil de valores y el modo seleccionado.

## 9) Presets iniciales (cargan controles)

- **Horno lento**: `K=0.015`, `τ=180 s`, `L=5 s`, `T_amb=25 °C`; `Kp=2.00`, `Ki=0.10 s⁻¹`, `Kd=10 s`.
- **Horno medio**: `K=0.03`, `τ=90 s`, `L=3 s`, `T_amb=25 °C`; `Kp=2.00`, `Ki=0.10`, `Kd=10`.
- **Chiller compacto**: `` (modo chiller con `K` negativo), `τ=60 s`, `L=2 s`, `T_amb=25 °C`; `Kp=2.00`, `Ki=0.10`, `Kd=10`.

## 10) Interacciones clave (mapa UI ⇄ lógica)

- **Iniciar/Pausar**: activa/detiene el bucle del Worker.
- **Reset**: `PV=T_amb`, integrador/derivada a 0, limpia buffers y métricas.
- **Cambios de sliders**: se aplican *on-the-fly* (no bloqueantes).
- **Presets**: sobreescriben valores visibles y envían un “reset de escenario” (opcional confirmar).
- **Paso de carga**: añade perturbación escalón `D` configurable (por defecto `+0.5·K` durante 10 s).
- **Ruido**: ajusta `σ` del ruido gaussiano sobre `PV` medida.
- **SSR por ventana**: si **ON**, usar potencia media equivalente; si **OFF**, `u` directo.

## 11) Reglas de seguridad y límites (para no romper nada)

- **Clamps**:
  - `SP`: `0–200 °C`.
  - `K`: `0–0.10` (en chiller usar `-0.10–0` si `K` negativo).
  - `τ`: `1–600 s`; `L`: `0–15 s`; `T_amb`: `10–35 °C`.
  - `Kp`: `0–10`; `Ki`: `0–1 s⁻¹`; `Kd`: `0–200 s`.
- **Salud numérica**: proteger divisiones por cero (`τ>0`, `Δt>0`), `NaN` y sobre-flujos; limitar `PV` a un rango razonable (p. ej., `−50 a 300 °C`) para visualización.

## 12) Rendimiento y pruebas

- **Rendimiento**: 10 Hz de simulación, UI fluida (ideal 60 FPS); no bloquear el hilo principal.
- **Pruebas de escenario**:
  - *Step test* desde `T_amb` a `60 °C` en cada preset (ver overshoot y `tₛ`).
  - Disturbio a los `60 s` y recuperación.
  - Tiempo muerto `L>0` validando el retardo.
  - Ruido moderado verificando que el filtro derivativo no haga “chillar” la salida.

## 13) Fuera de alcance (por ahora)

- Autotuning real, control de hardware, multi-pestañas, multi-escenarios persistentes, i18n a EN (más adelante si se quiere), autenticación.

## 14) Criterios de aceptación (DoD)

- La app corre en una sola pantalla, oscuro, con **todos los controles** operativos a nivel UI.
- El **modelo FOPDT** responde a **SP**, **PID** y **disturbios**; **modo chiller** implementado (K negativo recomendado).
- **Overshoot** y **tₛ** se calculan y actualizan en vivo tras cambios de `SP`/reset.
- **Ventana temporal** aplica a ambas gráficas; exportar CSV funciona.
- **SSR por ventana** afecta la potencia aplicada (media equivalente).
- No hay bloqueos; la simulación se pausa/reanuda correctamente; reset deja el sistema limpio.

