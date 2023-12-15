import { useEffect, useState } from "react";

export interface NotReady {
  isReady: false;
}

export interface Ready<T> {
  isReady: true;
  data: T;
}

export interface ReadyError<U> {
  isReady: true;
  error: U;
}

export type AsyncHook<T, U> = NotReady | Ready<T> | ReadyError<U>;

export function isReady<T, U>(
  value: AsyncHook<T, U>,
): value is Ready<T> | ReadyError<U> {
  return value.isReady;
}

export function isOk<T, U>(value: AsyncHook<T, U>): value is Ready<T> {
  return isReady(value) && "data" in value;
}

export function isErr<T, U>(value: AsyncHook<T, U>): value is ReadyError<U> {
  return isReady(value) && "error" in value;
}

export function ok<T>(data: T): Ready<T> {
  return {
    isReady: true,
    data,
  };
}

export function err<U>(err: U): ReadyError<U> {
  return {
    isReady: true,
    error: err,
  };
}

export function useAsyncHookState<T, U = string>(load: () => Promise<T>) {
  const [value, setValue] = useState<AsyncHook<T, U>>({
    isReady: false,
  });

  useEffect(() => {
    let signal = { abort: false };
    load()
      .then((result) => {
        if (signal.abort) {
          return;
        }
        setValue(ok(result));
      })
      .catch((e) => {
        if (signal.abort) {
          return;
        }

        console.error(e);
        setValue(err(e));
      });

    return () => {};
  }, [load]);

  return {
    value,
  };
}

const defaultLoad = <T,>(): (() => Promise<T>) => {
  return () => new Promise<T>(() => {});
};

export const useAsyncDependentLoad = <T, DT, DU>(
  data: AsyncHook<DT, DU>,
  getLoad: (data: Ready<DT>) => () => Promise<T>,
) => {
  const [load, setLoad] = useState<() => Promise<T>>(defaultLoad);

  useEffect(() => {
    if (isOk(data)) {
      const load = () => getLoad(data);
      setLoad(load);
    }
  }, [setLoad, getLoad, data]);

  return load;
};
