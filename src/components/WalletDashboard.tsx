import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { getXLMBalance, getAccountExplorerLink, shortenKey } from '../lib/stellar';
import { SendTransactionModal, FundAccountModal } from './Modals';

export function WalletDashboard() {
  const {
    isConnected,
    publicKey,
    accountInfo,
    isLoading,
    error,
    refreshBalance,
    disconnect,
    clearError,
  } = useWallet();

  const [sendOpen, setSendOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [isConnected, refreshBalance]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setRefreshing(false);
  };

  const handleCopy = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) return null;

  const xlmBalance = accountInfo ? getXLMBalance(accountInfo) : null;
  const isFunded = accountInfo !== null;

  return (
    <>
      <div className="dashboard">
        {/* Wallet Header */}
        <div className="wallet-card">
          <div className="wallet-card-header">
            <div className="wallet-status-badge">
              <span className="status-dot" /> Testnet
            </div>
            <button className="btn-disconnect" onClick={disconnect}>
              Disconnect
            </button>
          </div>

          <div className="wallet-identity">
            <div className="wallet-avatar">
              {publicKey ? publicKey.slice(0, 2) : '??'}
            </div>
            <div className="wallet-address-block">
              <p className="wallet-label">Connected Wallet</p>
              <div className="wallet-address-row">
                <span className="wallet-address">{publicKey ? shortenKey(publicKey, 8) : '...'}</span>
                <button
                  className="copy-btn"
                  onClick={handleCopy}
                  title="Copy full address"
                >
                  {copied ? '✓' : '⎘'}
                </button>
                <a
                  href={publicKey ? getAccountExplorerLink(publicKey) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-icon-btn"
                  title="View on Stellar Expert"
                >
                  ↗
                </a>
              </div>
            </div>
          </div>

          {/* XLM Balance */}
          <div className="balance-hero">
            {isLoading ? (
              <div className="balance-loading">
                <div className="spinner" />
                <span>Fetching balance…</span>
              </div>
            ) : isFunded ? (
              <>
                <div className="balance-xlm-amount">{xlmBalance}</div>
                <div className="balance-xlm-label">XLM</div>
              </>
            ) : (
              <div className="balance-unfunded">
                <p>Account not funded on Testnet</p>
                <button className="btn-friendbot" onClick={() => setFundOpen(true)}>
                  💧 Fund with Friendbot
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isFunded && (
            <div className="action-row">
              <button
                className="action-btn action-send"
                id="btn-send"
                onClick={() => setSendOpen(true)}
              >
                <span className="action-icon">↑</span>
                <span>Send XLM</span>
              </button>
              <button
                className="action-btn action-refresh"
                id="btn-refresh"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <span className={`action-icon ${refreshing ? 'spin' : ''}`}>↻</span>
                <span>{refreshing ? 'Refreshing' : 'Refresh'}</span>
              </button>
              <button
                className="action-btn action-fund"
                onClick={() => setFundOpen(true)}
              >
                <span className="action-icon">💧</span>
                <span>Friendbot</span>
              </button>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button className="error-close" onClick={clearError}>✕</button>
          </div>
        )}

        {/* All Balances */}
        {isFunded && accountInfo && accountInfo.balances.length > 0 && (
          <div className="all-balances-card">
            <h3 className="card-title">All Balances</h3>
            <div className="balance-list">
              {accountInfo.balances.map((b, i) => (
                <div key={i} className="balance-row">
                  <div className="balance-row-asset">
                    <div className="asset-icon">
                      {b.asset_type === 'native' ? '⭐' : '🪙'}
                    </div>
                    <div>
                      <div className="asset-name">
                        {b.asset_type === 'native' ? 'XLM' : b.asset_code}
                      </div>
                      <div className="asset-type">
                        {b.asset_type === 'native' ? 'Native Asset' : b.asset_type}
                      </div>
                    </div>
                  </div>
                  <div className="balance-row-amount">
                    {parseFloat(b.balance).toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Info Card */}
        {isFunded && accountInfo && (
          <div className="account-info-card">
            <h3 className="card-title">Account Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Subentries</span>
                <span className="info-value">{accountInfo.subentry_count}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Sequence</span>
                <span className="info-value mono">{accountInfo.sequence}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Ledger</span>
                <span className="info-value">{accountInfo.last_modified_ledger}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Network</span>
                <span className="info-value network-badge">Testnet</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <SendTransactionModal isOpen={sendOpen} onClose={() => setSendOpen(false)} />
      <FundAccountModal isOpen={fundOpen} onClose={() => setFundOpen(false)} />
    </>
  );
}
