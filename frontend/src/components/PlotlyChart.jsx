import React from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

export default function PlotlyChart({ data, layout, config, style, className }) {
  const defaultMinimalistLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
      color: '#888888',
      size: 11
    },
    margin: { t: 30, r: 25, b: 40, l: 50 },
    hoverlabel: {
      bgcolor: '#0a0a0a',
      bordercolor: '#333333',
      font: { color: '#ffffff', family: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', size: 11 }
    },
    xaxis: {
      gridcolor: '#181818',
      zerolinecolor: '#262626',
      tickfont: { color: '#666666', size: 10 },
      linecolor: '#222222'
    },
    yaxis: {
      gridcolor: '#181818',
      zerolinecolor: '#262626',
      tickfont: { color: '#666666', size: 10 },
      linecolor: '#222222'
    },
    legend: {
      font: { color: '#b0b0b0', size: 11 },
      bgcolor: '#0c0c0c',
      bordercolor: '#222222',
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
        layout={defaultMinimalistLayout}
        config={defaultConfig}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
