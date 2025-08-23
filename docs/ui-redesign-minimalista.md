### Propuesta de Rediseño UI — Elegante y Minimalista (sin scroll)

#### Objetivo
Lograr una interfaz limpia, elegante y funcional que se visualice completa en una sola pantalla (1366×768 y 1920×1080) sin scroll vertical, priorizando claridad, foco en los datos, y controles esenciales.

---

### 1) Principios de diseño
- **Jerarquía clara**: primero estado y acciones; luego métricas; finalmente gráficas.
- **Minimalismo funcional**: menos cromatismos, menos bordes, más espacio negativo.
- **Consistencia**: escala de espaciado y tipografía uniforme; componentes reutilizables.
- **Legibilidad**: contraste AA/AAA, tamaños de fuente y alturas de línea estables.
- **Responsive “desktop-first”**: foco en 1366×768 y 1920×1080, sin scroll; degradación elegante en pantallas más pequeñas con scroll interno por panel.

---

### 2) Estructura de layout sin scroll
Usaremos un contenedor de altura completa, grid de dos columnas con panel izquierdo fijo y panel derecho elástico. Todo el contenido debe respetar `min-h-0` para permitir colapsar altura y evitar overflow implícito.

```tsx
// En Dashboard.tsx (idea de clases Tailwind)
<div className="h-screen overflow-hidden">
  <main className="grid h-full gap-4 lg:grid-cols-[400px_1fr] p-4">
    {/* Panel izquierdo (controles) */}
    <section className="min-h-0 overflow-auto space-y-4">
      {/* bloques de control y presets */}
    </section>

    {/* Panel derecho (métricas + charts) */}
    <section className="min-h-0 grid grid-rows-[auto_auto_1fr] gap-4">
      <header className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Estado de Métricas, Overshoot, Establecimiento */}
      </header>
      <div className="min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tarjetas de información compactas */}
      </div>
      <div className="min-h-0 grid grid-rows-1 grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        <article className="min-h-0 overflow-hidden">
          {/* PV vs SP (chart) → ocupa todo el alto disponible */}
        </article>
        <article className="min-h-0 overflow-hidden">
          {/* Salida PID (%) (chart) */}
        </article>
      </div>
    </section>
  </main>
</div>
```

- **Claves técnicas**:
  - Wrapper: `h-screen overflow-hidden`.
  - `main`: `h-full`, grid con `lg:grid-cols-[400px_1fr]` y `gap-4`.
  - Panel izquierdo: `min-h-0 overflow-auto` para scroll interno solo si es necesario.
  - Panel derecho: `min-h-0` y subgrid de tres bandas, con la última fracción `1fr` para las gráficas.
  - Contenedores de chart: `min-h-0 overflow-hidden` para que los lienzos llenen el espacio sin provocar scroll global.

---

### 3) Estilo visual (elegante y minimalista)
- **Color**: paleta oscura templada con acentos sutiles.
  - Fondo: `bg-background` actual pero reducir el contraste de tarjetas.
  - Superficies: `card` con leve elevación: `border border-muted/30 bg-card/50 backdrop-blur`.
  - Acentos: un único color principal para sliders/botones (consistente con charts).
- **Tipografía**:
  - Títulos secciones: `text-sm font-medium tracking-wide text-muted-foreground`.
  - Valores y KPIs: `text-base/6 font-semibold text-foreground`.
- **Espaciado y densidad**:
  - Escala 4/8 (4, 8, 12, 16, 24). Exterior `p-4`, tarjetas `p-3`.
  - Reducir `gap` por defecto a `gap-3` en tarjetas internas.
- **Bordes y sombras**:
  - Radios suaves `rounded-lg`. Eliminar sombras duras; usar `shadow-[inset_0_1px_0_0_rgba(255,255,255,.03)]` sutil.
- **Iconografía**: Lucide ya presente; usar tamaño `h-4 w-4` y `text-muted-foreground`.

---

### 4) Componentes clave y ajustes
- **Header** (`src/components/Header.tsx`):
  - Compactar alto, alinear a la izquierda, agrupar acciones a la derecha.
  - Quitar “UI Mock”.
- **SimulationStatus**: 
  - Agrupar estado Worker/Simulación en línea, icono + texto, sin badges llamativos.
  - Botones primarios: `Iniciar` (primary), secundarios: `Pausar`, `Reset` con `variant="outline"`.
- **ControlsPanel**: 
  - Secciones colapsables por defecto (“Planta (avanzado)”, “Ruido y disturbios)”.
  - Entradas numéricas alineadas a la derecha; sliders con tooltip.
- **MetricsPanel**: 
  - Tres tarjetas horizontales y compactas con estado, overshoot y establecimiento.
  - Etiquetas pequeñas, valores legibles.
- **Charts** (`ChartPVSP`, `ChartOutput`):
  - Altura a `100%` del contenedor; cuadrícula fina; leyendas minimalistas.
  - Líneas semitransparentes y paleta consistente con color de acento.

---

### 5) Tokens de diseño (Tailwind + CSS vars)
Sugerencia de variables para coherencia entre UI y charts.

```css
/* index.css */
:root {
  --radius: 0.6rem;
  --surface: 255 255 255;      /* para mix con opacidades */
  --card: 17 17 20;            /* bg-card */
  --accent: 99 102 241;        /* indigo-500 */
}
.dark {
  --card: 20 22 26;
  --accent: 129 140 248;       /* indigo-400 */
}
```

```tsx
// Ejemplos de uso Tailwind
className="rounded-[var(--radius)] bg-[rgb(var(--card)/0.5)] border border-white/5"
className="text-[rgb(var(--accent))]"
```

---

### 6) Accesibilidad y usabilidad
- Contraste mínimo AA en texto crítico y UI controls.
- Estados de foco visibles en todos los interactivos (`focus:ring-2 ring-offset-1`).
- Atajos: `S` iniciar/pausar, `R` reset (ya presentes) con ayudas visuales discretas.
- Soporte de teclado completo en sliders/inputs.

---

### 7) Rendimiento
- Evitar sombras costosas y filtros fuertes; preferir bordes sutiles.
- Charts sin animaciones pesadas; redibujar solo al recibir nuevos puntos.
- Reutilizar memoización en paneles que no cambian por tick.

---

### 8) Plan de implementación (iterativo)
1. Layout base sin scroll en `Dashboard.tsx` con clases descritas.
2. Normalizar alturas con `min-h-0` y `overflow-*` en paneles y contenedores de charts.
3. Compactar `Header` y `SimulationStatus`.
4. Revisar `ControlsPanel` y colapsables por defecto.
5. Ajustar `MetricsPanel` a tarjetas horizontales compactas.
6. Unificar estilos de `Card` y botones (tokens + variantes outline).
7. Afinar charts para ocupar `100%` de su contenedor con paleta coherente.
8. QA con Playwright en 1366×768 y 1920×1080; validar sin scroll global.

---

### 9) Criterios de aceptación
- No existe scroll vertical ni horizontal en 1366×768 y 1920×1080.
- Controles clave visibles sin plegar scroll; charts visibles simultáneamente.
- Contraste AA y foco visible en interactivos.
- Sin regresiones en tests existentes.

---

### 10) Impacto en el código
- Archivos a editar: `src/pages/Dashboard.tsx`, `src/components/{Header,SimulationStatus,ControlsPanel,MetricsPanel,ChartPVSP,ChartOutput}.tsx`, `src/index.css` (tokens opcionales).
- No rompe contratos Worker ni lógica de simulación.

---

### 11) Riesgos y mitigaciones
- Diferencias de fuentes/sistemas: verificar alturas reales en Windows/Linux/macOS.
- Gráficas en navegadores con zoom ≠ 100%: asegurar `min-h-0` y `resizeObserver` si procede.
- Contenido avanzado expandido puede forzar overflow: mantener scroll interno en panel izquierdo.

---

### 12) Anexos (auditoría actual)
- 1366×768: documento 1351×1554, scroll vertical presente.
- 1920×1080: documento 1905×1554, scroll vertical presente.
- Offenders: `html/body/#root/.min-h-screen/main.grid ...`

Con los cambios de layout propuestos, el contenido quedará encapsulado y la pantalla principal no generará scroll global, manteniendo una estética más limpia y profesional.


