export type MoneyVo = {
  minValue: number;
  maxValue: number;
  format: string;
};

export type TimeVo = {
  second: number;
  minute: number;
};

export const rublesToKopecks = (rubles: number) => Math.round(rubles * 100);
export const kopecksToRubles = (kopecks: number) => kopecks / 100;

export const minutesToSeconds = (minutes: number) => minutes * 60;
export const secondsToMinutes = (seconds: number) => Math.round(seconds / 60);

export const moneyVo = (kopecks: number): MoneyVo => {
  const rubles = kopecksToRubles(kopecks);

  return {
    minValue: kopecks,
    maxValue: rubles,
    format: `${rubles} руб.`,
  };
};

export const timeVo = (seconds: number): TimeVo => ({
  second: seconds,
  minute: secondsToMinutes(seconds),
});
