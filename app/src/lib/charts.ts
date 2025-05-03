export const huesDomain = [
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

export const getDomainFromIndex = (idx: number) => {
  return huesDomain[idx % huesDomain.length];
};

export const colorFromIndexValueAndMax = (
  value: number,
  idx: number,
  max: number,
) => {
  const hueIndex = getDomainFromIndex(idx);
  const lightness = 30 + (value / max) * 40;
  return `hsl(${hueIndex}, 70%, ${lightness}%)`;
};

export const getYDomain = (data: number[], idx: number) => {
  return data.map((value) => {
    return {
      value,
      itemStyle: {
        color: colorFromIndexValueAndMax(value, idx, Math.max(...data)),
      },
    };
  });
};
