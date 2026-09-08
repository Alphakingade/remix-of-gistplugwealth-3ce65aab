/**
 * The site now talks to the database directly from the browser, so the former
 * server functions are plain async functions. This shim keeps every existing
 * call site (`const load = useServerFn(x)`) working unchanged.
 */
export function useServerFn<T>(fn: T): T {
  return fn;
}
