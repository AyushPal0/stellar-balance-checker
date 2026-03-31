import { useState } from 'react';
import { fetchAccountInfo, isValidPublicKey, getAccountExplorerLink, shortenKey, getXLMBalance } from '../lib/stellar';
import type { AccountInfo } from '../types/stellar';

interface LookupResult {
  accountInfo: AccountInfo | null;
  error: string | null;
  isLoading: boolean;
}

export function BalanceLookup() {
  const [searchKey, setSearchKey] = useState('');
  const [result, setResult] = useState<LookupResult>({ accountInfo: null, error: null, isLoading: false });

  const handleLookup = async () => {
    const key = searchKey.trim();
    if (!isValidPublicKey(key)) {
      setResult({ accountInfo: null, error: 'Invalid Stellar public key.', isLoading: false });
      return;
    }

    setResult({ accountInfo: null, error: null, isLoading: true });

    try {
      const info = await fetchAccountInfo(key);
      setResult({ accountInfo: info, error: null, isLoading: false });
    } catch {
      setResult({
        accountInfo: null,
        error: 'Account not found on Testnet. It may not be funded yet.',
        isLoading: false,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  return (
    <div className="lookup-container">
      <div className="lookup-header">
        <h2 className="section-title">🔍 Check Any Account</h2>
        <p className="section-subtitle">Enter any Stellar testnet public key to check its balance</p>
      </div>

      <div className="lookup-input-row">
        <input
          id="lookup-input"
          className="lookup-input"
          type="text"
          placeholder="Enter Stellar public key (G...)"
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn-primary"
          onClick={handleLookup}
          disabled={result.isLoading || !searchKey.trim()}
        >
          {result.isLoading ? (
            <span className="btn-loading"><span className="spinner-small" /> Checking…</span>
          ) : (
            'Check Balance'
          )}
        </button>
      </div>

      {result.error && (
        <div className="lookup-error">
          <span>⚠️</span> {result.error}
        </div>
      )}

      {result.accountInfo && (
        <div className="lookup-result">
          <div className="lookup-result-header">
            <div>
              <span className="result-label">Account</span>
              <a
                href={getAccountExplorerLink(result.accountInfo.publicKey)}
                target="_blank"
                rel="noopener noreferrer"
                className="explorer-link"
              >
                {shortenKey(result.accountInfo.publicKey, 8)} ↗
              </a>
            </div>
            <div className="xlm-badge-large">
              {getXLMBalance(result.accountInfo)} XLM
            </div>
          </div>

          <div className="balance-grid">
            {result.accountInfo.balances.map((balance, idx) => (
              <div key={idx} className="balance-card">
                <div className="balance-asset">
                  {balance.asset_type === 'native' ? '⭐ XLM' : `🪙 ${balance.asset_code}`}
                </div>
                <div className="balance-amount">{parseFloat(balance.balance).toFixed(4)}</div>
                {balance.asset_type !== 'native' && (
                  <div className="balance-issuer">{shortenKey(balance.asset_issuer || '', 6)}</div>
                )}
              </div>
            ))}
          </div>

          <div className="account-meta">
            <div className="meta-item">
              <span className="meta-label">Subentries</span>
              <span className="meta-value">{result.accountInfo.subentry_count}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Sequence</span>
              <span className="meta-value">{result.accountInfo.sequence}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Last Ledger</span>
              <span className="meta-value">{result.accountInfo.last_modified_ledger}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
