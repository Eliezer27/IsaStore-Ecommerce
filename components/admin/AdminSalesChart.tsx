"use client";

import { useEffect, useRef } from "react";

// Client Component a propósito: un <script> inline (dangerouslySetInnerHTML)
// dentro de un Server Component no funciona en React 19/Next 16 — React
// hidrata sobre ese <script> y nunca lo ejecuta ("Scripts inside React
// components are never executed when rendering on the client"). La forma
// correcta de correr JS de terceros (aquí, ApexCharts) después del montaje
// es un useEffect, no un <script> embebido en el árbol de React.
export default function AdminSalesChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    type ChartInstance = { render: () => void; destroy: () => void };
    let chart: ChartInstance | null = null;
    let cancelled = false;

    function init() {
      const w = window as unknown as {
        ApexCharts?: new (el: HTMLElement, config: object) => ChartInstance;
      };
      if (cancelled || !ref.current || !w.ApexCharts) {
        if (!cancelled && !w.ApexCharts) setTimeout(init, 150); // apexcharts.min.js puede seguir cargando
        return;
      }
      const instance = new w.ApexCharts(ref.current, {
        chart: {
          type: "bar",
          height: 300,
          toolbar: { show: false },
          fontFamily: "Nunito, sans-serif",
        },
        series: [{ name: "Ventas (C$)", data: values }],
        xaxis: { categories: labels },
        colors: ["#FF92C2"],
        plotOptions: { bar: { columnWidth: "50%", borderRadius: 4 } },
        dataLabels: { enabled: false },
      });
      chart = instance;
      instance.render();
    }

    init();
    return () => {
      cancelled = true;
      chart?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} />;
}
