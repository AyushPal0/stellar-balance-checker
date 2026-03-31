import {
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
  StrKey,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import type { AccountInfo, SendTransactionParams, TransactionResult } from '../types/stellar';

// Horizon server (Testnet)
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const server = new Horizon.Server(HORIZON_URL);

export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const HORIZON_SERVER = server;

type RawBalance = {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
  buying_liabilities?: string;
  selling_liabilities?: string;
};

/**
 * Fetch full account info from Horizon
 */
export async function fetchAccountInfo(publicKey: string): Promise<AccountInfo> {
  const account = await server.loadAccount(publicKey);

  return {
    publicKey,
    balances: account.balances.map((b) => {
      const raw = b as unknown as RawBalance;
      return {
        asset_type: raw.asset_type,
        asset_code: raw.asset_code,
        asset_issuer: raw.asset_issuer,
        balance: raw.balance,
        limit: raw.limit,
        buying_liabilities: raw.buying_liabilities,
        selling_liabilities: raw.selling_liabilities,
      };
    }),
    sequence: account.sequence,
    subentry_count: account.subentry_count,
    thresholds: {
      low_threshold: account.thresholds.low_threshold,
      med_threshold: account.thresholds.med_threshold,
      high_threshold: account.thresholds.high_threshold,
    },
    flags: {
      auth_required: account.flags.auth_required,
      auth_revocable: account.flags.auth_revocable,
      auth_immutable: account.flags.auth_immutable,
    },
    last_modified_ledger: account.last_modified_ledger,
  };
}

/**
 * Get XLM balance from account info
 */
export function getXLMBalance(accountInfo: AccountInfo): string {
  const native = accountInfo.balances.find((b) => b.asset_type === 'native');
  return native ? parseFloat(native.balance).toFixed(7) : '0.0000000';
}

/**
 * Validate a Stellar public key
 */
export function isValidPublicKey(key: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(key);
  } catch {
    return false;
  }
}

/**
 * Fund a testnet account via Friendbot
 */
export async function fundTestnetAccount(publicKey: string): Promise<boolean> {
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
  );
  return response.ok;
}

/**
 * Send XLM transaction on testnet
 */
export async function sendXLMTransaction(
  senderPublicKey: string,
  params: SendTransactionParams
): Promise<TransactionResult> {
  try {
    // Validate destination
    if (!isValidPublicKey(params.destination)) {
      return { success: false, error: 'Invalid destination address.' };
    }

    if (params.destination === senderPublicKey) {
      return { success: false, error: 'Cannot send to yourself.' };
    }

    const amount = parseFloat(params.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Invalid amount.' };
    }

    // Load sender account
    const sourceAccount = await server.loadAccount(senderPublicKey);

    // Fetch the current base fee
    const fee = await server.fetchBaseFee();

    // Build transaction
    let txBuilder = new TransactionBuilder(sourceAccount, {
      fee: String(fee),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: params.destination,
          asset: Asset.native(),
          amount: params.amount,
        })
      )
      .setTimeout(30);

    // Add memo if provided
    if (params.memo && params.memo.trim()) {
      txBuilder = txBuilder.addMemo(Memo.text(params.memo.trim()));
    }

    const transaction = txBuilder.build();
    const xdr = transaction.toXDR();

    // Sign with Freighter
    const signResult = await signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    let signedXDR: string;
    if (typeof signResult === 'string') {
      signedXDR = signResult;
    } else if (signResult && typeof signResult === 'object' && 'signedTxXdr' in signResult) {
      signedXDR = (signResult as { signedTxXdr: string }).signedTxXdr;
    } else {
      return { success: false, error: 'Failed to get signed transaction from Freighter.' };
    }

    // Submit to network
    const result = await server.submitTransaction(
      TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE)
    );

    return {
      success: true,
      hash: result.hash,
      timestamp: new Date().toISOString(),
    };
  } catch (err: unknown) {
    type HorizonError = { response?: { data?: { extras?: { result_codes?: { transaction?: string } } } } };
    const error = err as HorizonError;
    const resultCode = error?.response?.data?.extras?.result_codes?.transaction;
    const message = resultCode
      ? `Transaction failed: ${resultCode}`
      : err instanceof Error
      ? err.message
      : 'Unknown error occurred.';
    return { success: false, error: message };
  }
}

/**
 * Shorten a public key for display
 */
export function shortenKey(key: string, chars = 6): string {
  if (!key || key.length < chars * 2) return key;
  return `${key.slice(0, chars)}...${key.slice(-chars)}`;
}

/**
 * Get explorer link for a transaction hash
 */
export function getExplorerLink(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

/**
 * Get explorer link for a public key
 */
export function getAccountExplorerLink(publicKey: string): string {
  return `https://stellar.expert/explorer/testnet/account/${publicKey}`;
}
