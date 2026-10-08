import { aggregateEvents } from './aggregations.js';

export function buildTimeSeries({ events = [], metric = 'open_findings', organizationId = null, rangeDays = 30 }) {
  const series = [];
  const now = new Date();

  for (let offset = rangeDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - offset);
    date.setUTCHours(0, 0, 0, 0);
    const label = date.toISOString().slice(0, 10);
    const bucket = aggregateEvents(events, { metric, dimension: 'date', organizationId })
      .find((entry) => entry.label === label) || { value: 0 };
    series.push({ date: label, value: Number(bucket.value || 0) });
  }

  return series;
}
