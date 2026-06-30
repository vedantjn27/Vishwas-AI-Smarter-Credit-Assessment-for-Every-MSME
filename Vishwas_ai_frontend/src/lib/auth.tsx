import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";

interface AuthCtx {
  token: string | null;
  username: string | null;
  role: string | null;
  linkedMsmeId: number | null;
  isAuthenticated: boolean;
  login: (u: string, p: string, role?: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "vishwas_user";
const ROLE_KEY = "vishwas_role";
const LINKED_MSME_KEY = "vishwas_linked_msme_id";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [linkedMsmeId, setLinkedMsmeId] = useState<number | null>(null);

  useEffect(() => {
    const storedToken = getToken();
    setTok(storedToken);
    if (typeof window !== "undefined") {
      setUsername(localStorage.getItem(USER_KEY));
      setRole(localStorage.getItem(ROLE_KEY));
      const storedLinked = localStorage.getItem(LINKED_MSME_KEY);
      setLinkedMsmeId(storedLinked ? Number(storedLinked) : null);
    }
    if (storedToken) {
      api
        .me()
        .then((currentUser) => {
          setUsername(currentUser.username);
          setRole(currentUser.role);
          setLinkedMsmeId(currentUser.linked_msme_id);
          localStorage.setItem(USER_KEY, currentUser.username);
          localStorage.setItem(ROLE_KEY, currentUser.role);
          if (currentUser.linked_msme_id) {
            localStorage.setItem(LINKED_MSME_KEY, String(currentUser.linked_msme_id));
          } else {
            localStorage.removeItem(LINKED_MSME_KEY);
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, []);

  const login = async (u: string, p: string, manualRole?: string) => {
    let res;
    try {
      res = await api.login(u, p);
    } catch (error) {
      if (["admin", "credit_officer", "owner_1"].includes(u)) {
        await api.seed(18);
        res = await api.login(u, p);
      } else {
        throw error;
      }
    }
    setToken(res.access_token);
    setTok(res.access_token);
    const currentUser = await api.me();
    setUsername(currentUser.username);
    localStorage.setItem(USER_KEY, currentUser.username);
    const detectedRole = manualRole || currentUser.role;
    setRole(detectedRole);
    localStorage.setItem(ROLE_KEY, detectedRole);
    setLinkedMsmeId(currentUser.linked_msme_id);
    if (currentUser.linked_msme_id) {
      localStorage.setItem(LINKED_MSME_KEY, String(currentUser.linked_msme_id));
    } else {
      localStorage.removeItem(LINKED_MSME_KEY);
    }
  };

  const logout = () => {
    setToken(null);
    setTok(null);
    setUsername(null);
    setRole(null);
    setLinkedMsmeId(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(LINKED_MSME_KEY);
  };

  return (
    <Ctx.Provider
      value={{ token, username, role, linkedMsmeId, isAuthenticated: !!token, login, logout }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
};
