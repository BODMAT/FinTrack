export function simpleMemoize3<Args extends unknown[], R>(
  fn: (...args: Args) => R,
): (...args: Args) => R {
  let cacheKey = "";
  let cacheResult: R | undefined;

  return (...args: Args): R => {
    const key = JSON.stringify(args.slice(1));

    if (key !== cacheKey) {
      cacheKey = key;
      cacheResult = fn(...args);
    }
    return cacheResult as R;
  };
}
