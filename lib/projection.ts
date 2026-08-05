export interface ProjectionInput {
  weeklyHours: number;
  horizonMonths: number;
}

export interface ProjectionResult {
  totalHours: number;
  hoursPerDay: number;
  daysPerWeek: number;
}

/**
 * Pure ROI math: what does a weekly investment amount to over a horizon?
 * `weeklyHours × weeks` gives cumulative hours; daily equivalent derives
 * from a 7-day week.
 */
export function projectInvestment({
  weeklyHours,
  horizonMonths,
}: ProjectionInput): ProjectionResult {
  const weeks = horizonMonths * 4.34524;
  const totalHours = weeklyHours * weeks;
  const hoursPerDay = weeklyHours / 7;
  const daysPerWeek = weeklyHours > 0 ? Math.min(7, 168 / Math.max(1, weeklyHours)) : 0;

  return {
    totalHours: round(totalHours),
    hoursPerDay: round(hoursPerDay),
    daysPerWeek: round(daysPerWeek),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}