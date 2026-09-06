export function createStore<T extends object>(initialState: T) {
  let state = initialState;
  const listeners = new Set<(nextState: T) => void>();

  const getState = (): T => state;

  const setState = (partial: Partial<T> | ((current: T) => T), replace = false): void => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;

    state = replace ? (nextState as T) : { ...state, ...nextState };

    listeners.forEach(listener => {
      listener(state);
    });
  };

  const subscribe = (listener: (nextState: T) => void): (() => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  return { getState, setState, subscribe };
}
