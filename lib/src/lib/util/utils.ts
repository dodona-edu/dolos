export function closestMatch<V>(input: string, options: {[key: string]: V}): V | null {
  for(const key of Object.keys(options)) {
    if(key.startsWith(input)) {
      return options[key];
    }
  }
  return null;
}
