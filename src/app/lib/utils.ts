export const shorten = (str: string, before: number, after: number) => {
  let length = before + after + 3;

  if (str.length <= length) {
    return str;
  }

  const prefix = str.slice(0, before);
  const suffix = str.slice(str.length - after, str.length);
  return `${prefix}...${suffix}`;
};
