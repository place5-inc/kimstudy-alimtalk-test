import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type AppEnv = 'test' | 'prod';

export const TEST_HOST = 'https://dev-admin-api-cycndteybqbvbzc4.koreacentral-01.azurewebsites.net';
export const PROD_HOST = 'https://adminapi.place5.com';

interface EnvContextValue {
  env: AppEnv;
  setEnv: (env: AppEnv) => void;
}

const EnvContext = createContext<EnvContextValue>({
  env: 'test',
  setEnv: () => undefined,
});

export function EnvProvider({ children }: { children: ReactNode }) {
  const [env, setEnv] = useState<AppEnv>('test');
  return <EnvContext.Provider value={{ env, setEnv }}>{children}</EnvContext.Provider>;
}

export function useEnv() {
  return useContext(EnvContext);
}
