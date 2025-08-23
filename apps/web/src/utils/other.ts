export function simpleMemoize3<T extends (...args: any[]) => any>(fn: T): T {
    let cacheKey = "";
    let cacheResult: ReturnType<T> | undefined;
    return ((...args: Parameters<T>) => {
        const key = JSON.stringify(args.slice(1));
        if (key !== cacheKey) {
            cacheKey = key;
            cacheResult = fn(...args);
        }
        return cacheResult!;
    }) as T;
}