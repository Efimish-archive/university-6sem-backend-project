export type MoneyVo = {
  rubles: number;
  kopecks: number;
  format: string;
};

export type TimeVo = {
  second: number;
  minute: number;
};

export const rublesToKopecks = (rubles: number) => Math.floor(rubles * 100);
export const kopecksToRubles = (kopecks: number) => Math.floor(kopecks / 100);

export const minutesToSeconds = (minutes: number) => Math.floor(minutes * 60);
export const secondsToMinutes = (seconds: number) => Math.floor(seconds / 60);

export const moneyVo = (kopecks: number): MoneyVo => {
  const rubles = kopecksToRubles(kopecks);

  return {
    rubles: rubles,
    kopecks: kopecks,
    format: `${rubles} руб.`,
  };
};

export const timeVo = (seconds: number): TimeVo => ({
  second: seconds,
  minute: secondsToMinutes(seconds),
});
