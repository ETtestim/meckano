export const sleep = (delay: number) => {
    return new Promise<void>((res, rej) => {
      setTimeout(() => {
        res();
      }, delay);
    });
  };
  