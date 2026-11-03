import { chartPaths, type PitchPoint } from '../lib/telemetry';

/** Drawn with SVG: small, responsive and independent of charting/CDN services. */
export function PitchTimeline({ points, tolerance }: { points: readonly PitchPoint[]; tolerance: number }) {
  const lines = chartPaths(points);
  const safeHeight = Math.min(134, 134 * tolerance / 90);
  return <div className="pitch-timeline" aria-label={`Gráfico de afinação ao vivo, ${points.length} amostras, faixa válida de mais ou menos ${tolerance} cents`} role="img">
    <div className="pitch-chart-title"><strong>Traçado da afinação</strong><span>Últimos 9 segundos</span></div>
    <svg viewBox="0 0 480 178" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect x="42" y={88-safeHeight/2} width="410" height={safeHeight} fill="#239143" opacity=".10" rx="5"/>
      {[21,54.5,88,121.5,155].map(y => <line key={y} x1="42" x2="452" y1={y} y2={y} stroke="#91a9c7" opacity={y===88?.8:.22} strokeDasharray={y===88?'6 4':'3 4'}/>) }
      <text x="5" y="25" fontSize="11" fill="#67809c">+90</text>
      <text x="21" y="91" fontSize="11" fill="#348159">0</text>
      <text x="8" y="159" fontSize="11" fill="#67809c">−90</text>
      {lines.map((d,i)=><path key={i} d={d} stroke="#347fe4" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke"/>)}
      <text x="42" y="173" fontSize="10" fill="#879db4">Início</text>
      <text x="452" y="173" textAnchor="end" fontSize="10" fill="#879db4">Agora</text>
    </svg>
    <div className="pitch-chart-legend"><span><i className="legend-line"/> Altura captada</span><span><i className="legend-zone"/> Faixa de tolerância</span></div>
    {!lines.length && <div className="pitch-chart-empty">Toque a nota para visualizar a afinação durante o sopro.</div>}
  </div>;
}
