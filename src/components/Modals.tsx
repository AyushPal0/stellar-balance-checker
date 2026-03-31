import { useState } from 'react';
import { fundTestnetAccount, getAccountExplorerLink, shortenKey, sendXLMTransaction } from '../lib/stellar';
import { useWallet } from '../context/WalletContext';
import type { TransactionResult, SendTransactionParams } from '../types/stellar';

export function SendTransactionModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { publicKey, refreshBalance } = useWallet();
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);

  const handleSend = async () => {
    if (!publicKey) return;
    setIsSending(true);
    setResult(null);
    const params: SendTransactionParams = { destination, amount, memo };
    const res = await sendXLMTransaction(publicKey, params);
    setResult(res);
    setIsSending(false);
    if (res.success) {
      await refreshBalance();
    }
  };

  const handleClose = () => {
    setDestination('');
    setAmount('');
    setMemo('');
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send XLM</h2>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        {!result ? (
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">From</label>
              <div className="form-value">{publicKey ? shortenKey(publicKey) : '—'}</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="destination">Destination Address *</label>
              <input
                id="destination"
                className="form-input"
                type="text"
                placeholder="G... (Stellar public key)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="amount">Amount (XLM) *</label>
              <input
                id="amount"
                className="form-input"
                type="number"
                placeholder="0.0"
                min="0.0000001"
                step="0.0000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="memo">Memo (optional)</label>
              <input
                id="memo"
                className="form-input"
                type="text"
                placeholder="Transaction memo..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={28}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleClose} disabled={isSending}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSend}
                disabled={isSending || !destination || !amount}
              >
                {isSending ? (
                  <span className="btn-loading">
                    <span className="spinner-small" /> Signing…
                  </span>
                ) : (
                  '🚀 Send XLM'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            {result.success ? (
              <div className="tx-result tx-success">
                <div className="tx-result-icon">✅</div>
                <h3>Transaction Successful!</h3>
                <p className="tx-hash-label">Transaction Hash:</p>
                <div className="tx-hash">{result.hash}</div>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-explorer"
                >
                  View on Stellar Expert ↗
                </a>
              </div>
            ) : (
              <div className="tx-result tx-failure">
                <div className="tx-result-icon">❌</div>
                <h3>Transaction Failed</h3>
                <p className="tx-error-msg">{result.error}</p>
              </div>
            )}
            <button className="btn-primary" onClick={handleClose} style={{ marginTop: '1.5rem', width: '100%' }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FundAccountModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { publicKey, refreshBalance } = useWallet();
  const [isFunding, setIsFunding] = useState(false);
  const [funded, setFunded] = useState(false);
  const [error, setError] = useState('');

  const handleFund = async () => {
    if (!publicKey) return;
    setIsFunding(true);
    setError('');
    try {
      const ok = await fundTestnetAccount(publicKey);
      if (ok) {
        setFunded(true);
        await refreshBalance();
      } else {
        setError('Friendbot failed. The account may already be funded.');
      }
    } catch {
      setError('Friendbot request failed. Try again later.');
    }
    setIsFunding(false);
  };

  const handleClose = () => {
    setFunded(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Fund with Friendbot</h2>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>
        <div className="modal-body">
          {!funded ? (
            <>
              <p className="fund-description">
                Fund your testnet account with <strong>10,000 XLM</strong> from Stellar's Friendbot.
                This only works on the Testnet network.
              </p>
              <div className="fund-address">
                <span className="form-label">Your Address</span>
                <a
                  href={publicKey ? getAccountExplorerLink(publicKey) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-link"
                >
                  {publicKey ? shortenKey(publicKey, 8) : '—'} ↗
                </a>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button
                className="btn-primary"
                onClick={handleFund}
                disabled={isFunding}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {isFunding ? (
                  <span className="btn-loading">
                    <span className="spinner-small" /> Requesting…
                  </span>
                ) : (
                  '💧 Fund Account'
                )}
              </button>
            </>
          ) : (
            <div className="tx-result tx-success">
              <div className="tx-result-icon">🎉</div>
              <h3>Account Funded!</h3>
              <p>Your account has been funded with 10,000 XLM on Testnet.</p>
              <button className="btn-primary" onClick={handleClose} style={{ marginTop: '1rem', width: '100%' }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
