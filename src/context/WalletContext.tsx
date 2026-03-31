import { createContext, useContext, useReducer, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  isConnected,
  requestAccess,
} from '@stellar/freighter-api';
import { fetchAccountInfo } from '../lib/stellar';
import type { WalletState, AccountInfo } from '../types/stellar';

// ─── State & Actions ────────────────────────────────────────────────────────

type Action =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; publicKey: string; accountInfo: AccountInfo }
  | { type: 'CONNECT_ERROR'; error: string }
  | { type: 'DISCONNECT' }
  | { type: 'REFRESH_START' }
  | { type: 'REFRESH_SUCCESS'; accountInfo: AccountInfo }
  | { type: 'REFRESH_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' };

const initialState: WalletState = {
  isConnected: false,
  publicKey: null,
  accountInfo: null,
  isLoading: false,
  error: null,
};

function walletReducer(state: WalletState, action: Action): WalletState {
  switch (action.type) {
    case 'CONNECT_START':
    case 'REFRESH_START':
      return { ...state, isLoading: true, error: null };
    case 'CONNECT_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isConnected: true,
        publicKey: action.publicKey,
        accountInfo: action.accountInfo,
        error: null,
      };
    case 'CONNECT_ERROR':
    case 'REFRESH_ERROR':
      return { ...state, isLoading: false, error: action.error };
    case 'DISCONNECT':
      return { ...initialState };
    case 'REFRESH_SUCCESS':
      return { ...state, isLoading: false, accountInfo: action.accountInfo };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
  freighterAvailable: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const [freighterAvailable, setFreighterAvailable] = useState(false);

  // Check if Freighter is installed on mount
  useEffect(() => {
    const checkFreighter = async () => {
      try {
        const connected = await isConnected();
        // If freighter API responds without error, extension is available
        setFreighterAvailable(true);

        // Auto-reconnect if previously connected
        if (connected && typeof connected === 'object' && 'isConnected' in connected
          ? (connected as { isConnected: boolean }).isConnected
          : connected === true) {
          // Try to get the address silently
          try {
            const result = await requestAccess();
            let pk: string | null = null;
            if (typeof result === 'string') {
              pk = result;
            } else if (result && typeof result === 'object' && 'address' in result) {
              pk = (result as { address: string }).address;
            }
            if (pk) {
              dispatch({ type: 'CONNECT_START' });
              try {
                const accountInfo = await fetchAccountInfo(pk);
                dispatch({ type: 'CONNECT_SUCCESS', publicKey: pk, accountInfo });
              } catch {
                dispatch({ type: 'CONNECT_SUCCESS', publicKey: pk, accountInfo: null as unknown as AccountInfo });
                dispatch({ type: 'REFRESH_ERROR', error: 'Account not funded yet. Use Friendbot to fund it.' });
              }
            }
          } catch {
            // User hasn't approved yet – that's fine, wait for manual connect
          }
        }
      } catch {
        setFreighterAvailable(false);
      }
    };

    checkFreighter();
  }, []);

  const connect = useCallback(async () => {
    dispatch({ type: 'CONNECT_START' });
    try {
      // Request access from Freighter
      const result = await requestAccess();
      let publicKey: string;
      if (typeof result === 'string') {
        publicKey = result;
      } else if (result && typeof result === 'object' && 'address' in result) {
        publicKey = (result as { address: string }).address;
      } else {
        throw new Error('Failed to get public key from Freighter.');
      }

      if (!publicKey) {
        throw new Error('No public key returned. Did you deny access?');
      }

      try {
        const accountInfo = await fetchAccountInfo(publicKey);
        dispatch({ type: 'CONNECT_SUCCESS', publicKey, accountInfo });
      } catch {
        dispatch({ type: 'CONNECT_SUCCESS', publicKey, accountInfo: null as unknown as AccountInfo });
        dispatch({ type: 'REFRESH_ERROR', error: 'Account not funded on Testnet. Click "Fund with Friendbot" to get test XLM.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet.';
      dispatch({ type: 'CONNECT_ERROR', error: msg });
    }
  }, []);

  const disconnect = useCallback(() => {
    dispatch({ type: 'DISCONNECT' });
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.publicKey) return;
    dispatch({ type: 'REFRESH_START' });
    try {
      const accountInfo = await fetchAccountInfo(state.publicKey);
      dispatch({ type: 'REFRESH_SUCCESS', accountInfo });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh balance.';
      dispatch({ type: 'REFRESH_ERROR', error: msg });
    }
  }, [state.publicKey]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <WalletContext.Provider
      value={{ ...state, connect, disconnect, refreshBalance, clearError, freighterAvailable }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used inside <WalletProvider>');
  }
  return context;
}
