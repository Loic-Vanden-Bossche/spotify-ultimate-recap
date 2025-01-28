const huesDomain = [
  142, // Green
  277, // Purple
  0, // Red
  60, // Orange
  200, // Blue
  40, // Yellow
  90, // Green
  320, // Purple
  20, // Red
  80, // Orange
];

export const getYDomain = (data: number[], idx: number) => {
  return data.map((value) => {
    const hueIndex = huesDomain[idx % huesDomain.length];
    const lightness = 30 + (value / Math.max(...data)) * 40;
    return {
      value,
      itemStyle: {
        color: `hsl(${hueIndex}, 70%, ${lightness}%)`,
      },
    };
  });
};
