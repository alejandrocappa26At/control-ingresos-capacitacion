# Analítica KPI — Fuente de verdad de clasificación

Este módulo define el **cálculo y la clasificación de indicadores** del dashboard
"Control de Ingresos y Capacitación". La configuración central es
[`reclutadores.ts`](./reclutadores.ts) → `INDICADORES_KPI`.

> ⚠️ **Regla de oro:** los umbrales NO se escriben en componentes ni se comparten
> implícitamente entre indicadores. Siempre se leen de `INDICADORES_KPI`.

---

## Indicadores y umbrales de negocio (vigentes)

### Tasa de deserción — escala directa (menor = mejor)

Candidatos que ingresaron pero abandonaron antes de completar capacitación por decisión propia.
Fórmula: `(Total Deserciones ÷ Total Ingresos) × 100`

| Nivel     | Rango        | Regla            |
| --------- | ------------ | ---------------- |
| 🟢 Excelente | `≤ 5%`       | tasa ≤ 5         |
| 🟡 Aceptable | `> 5% – 10%` | 5 < tasa ≤ 10    |
| 🟠 Riesgo    | `> 10% – 15%`| 10 < tasa ≤ 15   |
| 🔴 Crítico   | `> 15%`      | tasa > 15        |

### Tasa de baja en capacitación — escala directa

Personas separadas por la empresa durante capacitación por evaluación, conducta u otros motivos.
Fórmula: `(Total Bajas en Capacitación ÷ Total Ingresos) × 100`

| Nivel     | Rango         | Regla             |
| --------- | ------------- | ----------------- |
| 🟢 Excelente | `≤ 8%`        | tasa ≤ 8          |
| 🟡 Aceptable | `> 8% – 12%`  | 8 < tasa ≤ 12     |
| 🟠 Riesgo    | `> 12% – 18%` | 12 < tasa ≤ 18    |
| 🔴 Crítico   | `> 18%`       | tasa > 18         |

### Conversión a operaciones — escala invertida (mayor = mejor)

Personas que completaron capacitación y pasaron a operaciones.
Fórmula: `(Aprobados ÷ Total Ingresos) × 100`

| Nivel     | Rango         | Regla             |
| --------- | ------------- | ----------------- |
| 🟢 Excelente | `≥ 88%`       | tasa ≥ 88         |
| 🟡 Aceptable | `83% – 88%`   | 83 ≤ tasa < 88    |
| 🟠 Riesgo    | `78% – 83%`   | 78 ≤ tasa < 83    |
| 🔴 Crítico   | `< 78%`       | tasa < 78         |

### Permanencia — escala invertida (mayor = mejor)

Personas que continúan en proceso o llegaron a operación.
Fórmula: `((Aprobados + En Capacitación) ÷ Total Ingresos) × 100`

| Nivel     | Rango          | Regla             |
| --------- | -------------- | ----------------- |
| 🟢 Excelente | `≥ 95%`        | tasa ≥ 95         |
| 🟡 Aceptable | `90% – 95%`    | 90 ≤ tasa < 95    |
| 🟠 Riesgo    | `85% – 90%`    | 85 ≤ tasa < 90    |
| 🔴 Crítico   | `< 85%`        | tasa < 85         |

**Colores del sistema:** Verde `#22c55e` · Amarillo `#eab308` · Naranja `#f97316` · Rojo `#dc2626`.

---

## Estructura de la configuración

```ts
INDICADORES_KPI: Record<IndicadorKpiId, ConfigIndicadorKpi> = {
  desercion | baja | conversion | permanencia: {
    id, nombre, descripcion, formula,
    direccion: 'asc' | 'desc',   // 'asc': menor = mejor · 'desc': mayor = mejor
    niveles: [                   // ordenados de mejor a peor
      { nivel, rango, max? }     // 'asc': max = límite superior inclusivo
      { nivel, rango, min? }     // 'desc': min = límite inferior inclusivo
    ]
  }
}
```

## API de evaluación

| Función                           | Uso                                                    |
| --------------------------------- | ------------------------------------------------------ |
| `evaluarNivelKpi(id, tasa)`       | Nivel (`'excelente' \| 'aceptable' \| 'riesgo' \| 'critico'`) de una tasa |
| `semaforoKpi(id, tasa)`           | Estilo del nivel: `{ emoji, label, color, dim }`       |
| `SEMAFORO_STYLES[nivel]`          | Estilo directo por nivel                               |
| `rangoNivel(id, nivel)`           | Texto del rango de un nivel (ej. `'> 12% – 18%'`)      |
| `tooltipKpi(id, nivel)`           | Tooltip estándar de badges: `'Riesgo · > 12% – 18%'`   |

`analizarReclutadores()` precalcula por reclutador: `nivel` (deserción),
`nivelBaja`, `nivelConversion` y `nivelPermanencia`. **Las fórmulas de tasas viven solo
ahí** — los componentes únicamente renderizan.

## Consumidores

- `MatrizReclutadores.tsx` — pills por KPI + tooltips (`title`)
- `ReclutadorDetailModal.tsx` — badge de deserción
- `GuiaInterpretacionIndicadores.tsx` — tarjetas y modal de metodología
- `zonas.ts` → `MatrizZonaComercial.tsx` — clasifica zonas con
  `evaluarNivelKpi('desercion', …)`; su leyenda (`ZONA_SEMAFORO_RANGOS`) se
  **deriva** de `INDICADORES_KPI.desercion` (misma clasificación que Reclutadores)

## Validación

```bash
npm run check:rangos   # valores límite, no-shared-ranges, fórmulas intactas,
                       # etiquetas, tooltips y alineación de Zonas
```

Los valores límite inclusivos (5/10/15, 8/12/18, 78/83/88, 85/90/95) están cubiertos por
ese script — ejecutarlo tras tocar cualquier umbral.

## Cómo agregar o modificar un indicador

1. Agregar la entrada en `INDICADORES_KPI` (nombre, descripción, fórmula, dirección, niveles).
2. Agregar su cálculo en `analizarReclutadores()` si aplica a filas de la matriz.
3. Agregar casos de borde en `scripts/check-rangos-kpi.mjs`.
4. Ejecutar `npm run check:rangos` y `npx tsc --noEmit`.
