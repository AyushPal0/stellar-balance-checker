import { WalletProvider, useWallet } from './context/WalletContext';
import { ConnectScreen } from './components/ConnectScreen';
import { WalletDashboard } from './components/WalletDashboard';
import { BalanceLookup } from './components/BalanceLookup';
import './App.css';

function AppContent() {
  const { isConnected } = useWallet();

  return (
    <div className="app">
      {/* Navigation Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">StellarCheck</span>
          </div>
          <div className="header-badge">Testnet</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {!isConnected ? (
          <ConnectScreen />
        ) : (
          <div className="layout">
            <div className="layout-left">
              <WalletDashboard />
            </div>
            <div className="layout-right">
              <BalanceLookup />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          Built on{' '}
          <a href="https://stellar.org" target="_blank" rel="noopener noreferrer">
            Stellar
          </a>{' '}
          Testnet · Powered by{' '}
          <a href="https://developers.stellar.org/docs/tools/sdks/library#javascript-sdk" target="_blank" rel="noopener noreferrer">
            Stellar SDK
          </a>{' '}
          &{' '}
          <a href="https://freighter.app" target="_blank" rel="noopener noreferrer">
            Freighter
          </a>
        </p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;
