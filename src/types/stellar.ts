// Types for Stellar Wallet Balance Checker dApp

export interface Balance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
  buying_liabilities?: string;
  selling_liabilities?: string;
}

export interface AccountInfo {
  publicKey: string;
  balances: Balance[];
  sequence: string;
  subentry_count: number;
  thresholds: {
    low_threshold: number;
    med_threshold: number;
    high_threshold: number;
  };
  flags: {
    auth_required: boolean;
    auth_revocable: boolean;
    auth_immutable: boolean;
  };
  last_modified_ledger: number;
}

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  accountInfo: AccountInfo | null;
  isLoading: boolean;
  error: string | null;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  timestamp?: string;
}

export interface SendTransactionParams {
  destination: string;
  amount: string;
  memo?: string;
}
