import { useWallet } from '../context/WalletContext';

export function ConnectScreen() {
  const { connect, isLoading, error, freighterAvailable } = useWallet();

  return (
    <div className="connect-screen">
      <div className="connect-card">
        {/* Logo / Hero */}
        <div className="connect-hero">
          <div className="stellar-logo">✦</div>
          <h1 className="connect-title">Stellar Balance Checker</h1>
          <p className="connect-subtitle">
            Check XLM balances, fund accounts, and send transactions on the Stellar Testnet
          </p>
        </div>

        {/* Network Badge */}
        <div className="network-tag">
          <span className="status-dot" /> Stellar Testnet
        </div>

        {/* Features */}
        <div className="feature-grid">
          <div className="feature-item">
            <span className="feature-icon">💳</span>
            <span className="feature-text">Connect Freighter Wallet</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💰</span>
            <span className="feature-text">View XLM Balances</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔍</span>
            <span className="feature-text">Lookup Any Account</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🚀</span>
            <span className="feature-text">Send XLM Transactions</span>
          </div>
        </div>

        {/* CTA */}
        {freighterAvailable ? (
          <button
            className="btn-connect"
            id="btn-connect-wallet"
            onClick={connect}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner-small" /> Connecting…
              </span>
            ) : (
              <>
                <img
                  src="https://freighter.app/favicon.ico"
                  alt="Freighter"
                  className="freighter-icon"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
                Connect Freighter Wallet
              </>
            )}
          </button>
        ) : (
          <div className="no-freighter">
            <p>Freighter wallet extension not detected.</p>
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-install"
            >
              Install Freighter →
            </a>
          </div>
        )}

        {error && (
          <div className="connect-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Info footer */}
        <p className="connect-footnote">
          This dApp operates on the <strong>Stellar Testnet</strong>. No real funds are used.
        </p>
      </div>
    </div>
  );
}
