import React from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

export default function PlotlyChart({ data, layout, config, style, className }) {
  const defaultDarkLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'Inter, sans-serif',
      color: '#94a3b8',
      size: 12
    },
    margin: { t: 30, r: 25, b: 40, l: 50 },
    hoverlabel: {
      bgcolor: '#0f172a',
      bordercolor: '#3b82f6',
      font: { color: '#ffffff', family: 'Inter, sans-serif' }
    },
    xaxis: {
      gridcolor: 'rgba(255, 255, 255, 0.06)',
      zerolinecolor: 'rgba(255, 255, 255, 0.12)',
      tickfont: { color: '#64748b' }
    },
    yaxis: {
      gridcolor: 'rgba(255, 255, 255, 0.06)',
      zerolinecolor: 'rgba(255, 255, 255, 0.12)',
      tickfont: { color: '#64748b' }
    },
    legend: {
      font: { color: '#cbd5e1' },
      bgcolor: 'rgba(15, 23, 42, 0.6)',
      bordercolor: 'rgba(255, 255, 255, 0.1)',
      borderwidth: 1
    },
    ...layout
  };

  const defaultConfig = {
    responsive: true,
    displayModeBar: false,
    ...config
  };

  return (
    <div className={`plotly-wrapper ${className || ''}`} style={{ width: '100%', height: '100%', minHeight: '320px', ...style }}>
      <Plot
        data={data}
        layout={defaultDarkLayout}
        config={defaultConfig}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
