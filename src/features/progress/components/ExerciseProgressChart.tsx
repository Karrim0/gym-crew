import { TrendLineChart } from "./TrendLineChart";

export interface ExerciseProgressChartProps {
  points: Array<{ label: string; value: number }>;
  valueLabel: string;
  formatValue?: (value: number) => string;
}

export function ExerciseProgressChart({ points, valueLabel, formatValue }: ExerciseProgressChartProps) {
  return <TrendLineChart points={points} valueLabel={valueLabel} formatValue={formatValue} />;
}
