import { createContext, useContext } from 'react';
import type { Role } from '@/types';

export type Session = {
  role: Role | null;
  setRole: (r: Role | null) => void;
  managerId: string | null;
  setManagerId: (id: string | null) => void;
  token: string | null;
  setToken: (t: string | null) => void;
  email: string | null;
  setEmail: (e: string | null) => void;
};

export const SessionContext = createContext<Session>({
  role: null,
  setRole: () => {},
  managerId: null,
  setManagerId: () => {},
  token: null,
  setToken: () => {},
  email: null,
  setEmail: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}
