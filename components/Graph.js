// Draws a graph to scale from a description the tutor writes, for example:
//   { "curves": [{ "expr": "x^2 - 6x + 5", "label": "y = x² − 6x + 5" }],
//     "points": [{ "x": 3, "y": -4, "label": "Vertex (3, −4)" }],
//     "verticals": [{ "x": 3, "label": "Axis x = 3" }],
//     "x": [-1, 7], "y": [-5, 6] }
// The AI only says WHAT to plot; this file works out WHERE, so graphs are always accurate.

import { useId } from "react";
import { compileExpression } from "@/lib/mathExpression";

const WIDTH = 400;
const PLOT_HEIGHT = 300;
const LEGEND_ROW = 20;
const PAD = { left: 34, right: 14, top: 14, bottom: 28 };
const CURVE_COLORS = ["#F59E42", "#4F9DDE", "#3DB38A", "#D96BA0"];
const INK = "var(--chick-line)";
const VERTICAL_COLOR = "#8A6FD1";
const SAMPLES = 240;

export default function Graph({ spec }) {
  const clipId = useId();
  const curves = (spec.curves || []).flatMap((curve, i) => {
    try {
      return [{ ...curve, fn: compileExpression(curve.expr), color: CURVE_COLORS[i % CURVE_COLORS.length] }];
    } catch {
      return []; // skip a curve the AI wrote in a way we can't read
    }
  });
  const points = (spec.points || []).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const verticals = (spec.verticals || []).filter((v) => Number.isFinite(v.x));
  if (!curves.length && !points.length) return null;

  // The color key sits under the graph, one row per curve or vertical line.
  const keyRows = curves.length + verticals.filter((v) => v.label).length;
  const height = PLOT_HEIGHT + keyRows * LEGEND_ROW + (keyRows ? 6 : 0);
  const [xMin, xMax] = pickXRange(spec.x, points);
  const [yMin, yMax] = pickYRange(spec.y, curves, points, xMin, xMax);

  // Math coordinates → pixel coordinates.
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = PLOT_HEIGHT - PAD.top - PAD.bottom;
  const px = (x) => PAD.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const py = (y) => PAD.top + ((yMax - y) / (yMax - yMin)) * plotH;

  const xTicks = ticks(xMin, xMax);
  const yTicks = ticks(yMin, yMax);
  // Axes sit at 0 when 0 is visible, otherwise along the edge.
  const axisY = py(clamp(0, yMin, yMax));
  const axisX = px(clamp(0, xMin, xMax));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full rounded-2xl border-[3px] border-line bg-white" role="img" aria-label={describe(curves, points)}>
      <defs>
        <clipPath id={clipId}>
          <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} />
        </clipPath>
      </defs>

      {/* Grid */}
      <g stroke="oklch(92% 0.02 80)" strokeWidth="1">
        {xTicks.map((t) => <line key={`gx${t}`} x1={px(t)} x2={px(t)} y1={PAD.top} y2={PAD.top + plotH} />)}
        {yTicks.map((t) => <line key={`gy${t}`} x1={PAD.left} x2={PAD.left + plotW} y1={py(t)} y2={py(t)} />)}
      </g>

      {/* Axes with numbers */}
      <g stroke={INK} strokeWidth="2">
        <line x1={PAD.left} x2={PAD.left + plotW} y1={axisY} y2={axisY} />
        <line x1={axisX} x2={axisX} y1={PAD.top} y2={PAD.top + plotH} />
      </g>
      <g fill={INK} fontSize="11" fontFamily="sans-serif">
        {xTicks.filter((t) => t !== 0).map((t) => (
          <text key={`tx${t}`} x={px(t)} y={Math.min(axisY + 14, PLOT_HEIGHT - 4)} textAnchor="middle">{formatNumber(t)}</text>
        ))}
        {yTicks.filter((t) => t !== 0).map((t) => (
          <text key={`ty${t}`} x={Math.max(axisX - 5, 24)} y={py(t) + 4} textAnchor="end">{formatNumber(t)}</text>
        ))}
        <text x={PAD.left + plotW - 2} y={axisY - 6} textAnchor="end" fontStyle="italic">x</text>
        <text x={axisX + 6} y={PAD.top + 11} fontStyle="italic">y</text>
      </g>

      {/* Curves */}
      <g clipPath={`url(#${clipId})`} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {curves.map((curve, i) => (
          <path key={i} d={curvePath(curve.fn, xMin, xMax, yMin, yMax, px, py)} stroke={curve.color} />
        ))}
      </g>

      {/* Vertical lines (dashed), like an axis of symmetry */}
      <g clipPath={`url(#${clipId})`} stroke={VERTICAL_COLOR} strokeWidth="2.5" strokeDasharray="7 5">
        {verticals.map((v, i) => (
          <line key={i} x1={px(v.x)} x2={px(v.x)} y1={PAD.top} y2={PAD.top + plotH} />
        ))}
      </g>

      {/* Marked points, with labels kept inside the picture */}
      {points.map((p, i) => {
        const x = px(p.x);
        const y = py(p.y);
        const below = y < PAD.top + 30;
        const anchor = x > WIDTH - 90 ? "end" : x < 90 ? "start" : "middle";
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="5.5" fill="#F9C6D9" stroke={INK} strokeWidth="2.5" />
            {p.label && (
              <text
                x={x + (anchor === "start" ? 8 : anchor === "end" ? -8 : 0)}
                y={below ? y + 20 : y - 11}
                textAnchor={anchor}
                fontSize="13"
                fontWeight="600"
                fontFamily="sans-serif"
                fill={INK}
                stroke="white"
                strokeWidth="4"
                paintOrder="stroke"
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Color key under the graph: which color is which curve */}
      <g fontSize="13" fontFamily="sans-serif" fontWeight="600">
        {curves.map((curve, i) => (
          <g key={i} transform={`translate(${PAD.left}, ${PLOT_HEIGHT + 8 + i * LEGEND_ROW})`}>
            <rect x="0" y="-6" width="18" height="5" rx="2.5" fill={curve.color} />
            <text x="26" y="0" fill={INK}>
              {curve.label || `y = ${curve.expr}`}
            </text>
          </g>
        ))}
        {verticals
          .filter((v) => v.label)
          .map((v, i) => (
            <g key={`v${i}`} transform={`translate(${PAD.left}, ${PLOT_HEIGHT + 8 + (curves.length + i) * LEGEND_ROW})`}>
              <line x1="0" x2="18" y1="-3.5" y2="-3.5" stroke={VERTICAL_COLOR} strokeWidth="2.5" strokeDasharray="5 3" />
              <text x="26" y="0" fill={INK}>
                {v.label}
              </text>
            </g>
          ))}
      </g>
    </svg>
  );
}

// Use the AI's x range if it gave one; otherwise fit the marked points, or default to −10…10.
function pickXRange(range, points) {
  if (validRange(range)) return range;
  if (points.length) {
    const xs = points.map((p) => p.x);
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    const pad = Math.max(3, (max - min) * 0.5);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }
  return [-10, 10];
}

// Use the AI's y range if it gave one; otherwise fit the curves (ignoring huge spikes) and points.
function pickYRange(range, curves, points, xMin, xMax) {
  if (validRange(range)) return range;
  const ys = points.map((p) => p.y);
  for (const curve of curves) {
    for (let i = 0; i <= 60; i++) {
      const y = curve.fn(xMin + ((xMax - xMin) * i) / 60);
      if (Number.isFinite(y)) ys.push(y);
    }
  }
  if (!ys.length) return [-10, 10];
  ys.sort((a, b) => a - b);
  // Drop the most extreme 5% on each side so one spike (like 1/x near 0) doesn't flatten everything.
  const cut = Math.floor(ys.length * 0.05);
  const kept = ys.slice(cut, ys.length - cut);
  let min = Math.min(kept[0], ...points.map((p) => p.y), 0);
  let max = Math.max(kept.at(-1), ...points.map((p) => p.y), 0);
  if (max - min < 1) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.12;
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

function validRange(range) {
  return Array.isArray(range) && range.length === 2 && range.every(Number.isFinite) && range[1] > range[0];
}

// Sample the curve and draw it, lifting the pen where it's undefined or shoots off the chart.
function curvePath(fn, xMin, xMax, yMin, yMax, px, py) {
  const span = yMax - yMin;
  let d = "";
  let penDown = false;
  for (let i = 0; i <= SAMPLES; i++) {
    const x = xMin + ((xMax - xMin) * i) / SAMPLES;
    const y = fn(x);
    if (!Number.isFinite(y) || y > yMax + span * 2 || y < yMin - span * 2) {
      penDown = false;
      continue;
    }
    d += `${penDown ? "L" : "M"}${px(x).toFixed(1)} ${py(y).toFixed(1)}`;
    penDown = true;
  }
  return d;
}

// Nice round tick marks (every 1, 2, 5, 10, 20, …) with about 8 per axis.
function ticks(min, max) {
  const rough = (max - min) / 8;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough);
  const result = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) result.push(Number(t.toFixed(10)));
  return result;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(n) {
  return String(Number(n.toFixed(2))).replace("-", "−");
}

// A text description for screen readers.
function describe(curves, points) {
  const parts = curves.map((c) => c.label || `y = ${c.expr}`);
  parts.push(...points.map((p) => p.label || `point (${p.x}, ${p.y})`));
  return `Graph: ${parts.join(", ")}`;
}
