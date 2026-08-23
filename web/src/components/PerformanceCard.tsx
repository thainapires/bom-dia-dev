import { AltArrowDownIcon } from "@solar-icons/react/linear/alt-arrow-down";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Desempenho } from "../types";

const COLOR_ABERTOS = "#c4b5fd";
const COLOR_FECHADOS = "#7fb069";
const COLOR_MELHOROU = "#7fb069";
const COLOR_PIOROU = "#ED6081";

const tooltipStyle = {
  background: "#19232F",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
};

const axisTick = { fill: "rgba(255,255,255,0.4)", fontSize: 11 };

export function PerformanceCard({ desempenho }: { desempenho: Desempenho }) {
  const data = desempenho.seriePorSemana.map((semana) => ({
    label: semana.inicio,
    abertos: semana.abertos,
    fechados: semana.fechados,
    tempoMedioMergeDias:
      semana.tempoMedioMergeDias !== null ? Number(semana.tempoMedioMergeDias.toFixed(1)) : null,
  }));

  const variacao = desempenho.variacaoPercentual;
  const melhorou = variacao !== null && variacao > 0;
  const piorou = variacao !== null && variacao < 0;

  return (
    <div className="rounded-lg bg-card p-4 border-white/5 border">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white/80">Seu desempenho</h2>
        <span className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-white/50">
          Últimos {desempenho.periodoDias} dias
          <AltArrowDownIcon size={12} />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs text-white/50 uppercase">MRs abertos vs. fechados</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-2xl font-semibold" style={{ color: COLOR_ABERTOS }}>
              {desempenho.totalAbertos}
              <span className="ml-1 text-xs font-normal text-white/40">abertos</span>
            </span>
            <span className="text-2xl font-semibold text-status-ready">
              {desempenho.totalFechados}
              <span className="ml-1 text-xs font-normal text-white/40">fechados</span>
            </span>
          </div>
          <div className="mt-2 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  padding={{ left: 24, right: 24 }}
                />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="abertos"
                  name="Abertos"
                  stroke={COLOR_ABERTOS}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="fechados"
                  name="Fechados"
                  stroke={COLOR_FECHADOS}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs text-white/50 uppercase">Tempo médio até merge</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white">{desempenho.tempoMedioMergeDiasAtual}</span>
            {variacao !== null && (
              <span
                className="text-xs font-medium"
                style={{ color: melhorou ? COLOR_MELHOROU : piorou ? COLOR_PIOROU : "rgba(255,255,255,0.4)" }}
              >
                {melhorou ? "↓" : piorou ? "↑" : "→"} {Math.abs(variacao)}% vs. período anterior
              </span>
            )}
          </div>
          <div className="mt-2 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={0} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="tempoMedioMergeDias"
                  name="Dias até merge"
                  fill={COLOR_ABERTOS}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
