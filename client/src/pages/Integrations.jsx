import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import {
  Puzzle, ExternalLink, Check, GitBranch, Cloud, Container,
  Webhook, Terminal, Lock, RefreshCw, Zap, Server,
} from 'lucide-react';

const INTEGRATIONS = [
  {
    id: 'github-actions',
    name: 'GitHub Actions',
    desc: 'Automatically inject secrets into your CI/CD pipelines. Sync environment variables with your GitHub repositories.',
    icon: <GitBranch size={24} />,
    category: 'CI/CD',
    color: '#fff',
    bg: 'linear-gradient(135deg, #24292e, #40464e)',
    docsUrl: 'https://docs.github.com/en/actions',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    desc: 'Sync secrets to Vercel projects automatically. Keep your preview and production environments in sync.',
    icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 1L24 22H0L12 1Z"/></svg>,
    category: 'Hosting',
    color: '#fff',
    bg: 'linear-gradient(135deg, #000, #333)',
    docsUrl: 'https://vercel.com/docs',
  },
  {
    id: 'docker',
    name: 'Docker',
    desc: 'Inject secrets at build time or runtime into your Docker containers. Support for Docker Compose and Swarm.',
    icon: <Container size={24} />,
    category: 'Containers',
    color: '#fff',
    bg: 'linear-gradient(135deg, #0db7ed, #0a8bc2)',
    docsUrl: 'https://docs.docker.com',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    desc: 'Sync secrets to Kubernetes namespaces. Create and manage K8s Secrets and ConfigMaps automatically.',
    icon: <Server size={24} />,
    category: 'Containers',
    color: '#fff',
    bg: 'linear-gradient(135deg, #326ce5, #2854b5)',
    docsUrl: 'https://kubernetes.io/docs',
  },
  {
    id: 'aws',
    name: 'AWS Secrets Manager',
    desc: 'Bi-directional sync with AWS Secrets Manager. Automatically rotate and manage secrets in AWS.',
    icon: <Cloud size={24} />,
    category: 'Cloud',
    color: '#fff',
    bg: 'linear-gradient(135deg, #ff9900, #cc7a00)',
    docsUrl: 'https://aws.amazon.com/secrets-manager/',
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    desc: 'Get notified when secrets change. Send HTTP callbacks to your own services for real-time updates.',
    icon: <Webhook size={24} />,
    category: 'Automation',
    color: '#fff',
    bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    docsUrl: null,
  },
  {
    id: 'cli',
    name: 'Vaultix CLI',
    desc: 'Use the CLI to pull secrets into your local environment, run commands with injected variables, and more.',
    icon: <Terminal size={24} />,
    category: 'Developer Tools',
    color: '#fff',
    bg: 'linear-gradient(135deg, #22c55e, #16a34a)',
    docsUrl: 'https://github.com/HR8475/Vaultix/tree/main/cli',
  },
  {
    id: 'vault',
    name: 'HashiCorp Vault',
    desc: 'Import and sync secrets with HashiCorp Vault. Integrate with existing Vault infrastructure seamlessly.',
    icon: <Lock size={24} />,
    category: 'Security',
    color: '#fff',
    bg: 'linear-gradient(135deg, #ffec6e, #d4a72c)',
    docsUrl: 'https://www.vaultproject.io/docs',
  },
  {
    id: 'rotation',
    name: 'Auto Rotation',
    desc: 'Automatically rotate secrets on a schedule. Keep your credentials fresh and reduce security risks.',
    icon: <RefreshCw size={24} />,
    category: 'Security',
    color: '#fff',
    bg: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    docsUrl: null,
  },
  {
    id: 'slack',
    name: 'Slack Notifications',
    desc: 'Get notified in Slack when secrets are created, updated, or deleted. Stay informed with your team.',
    icon: <Zap size={24} />,
    category: 'Notifications',
    color: '#fff',
    bg: 'linear-gradient(135deg, #4a154b, #7c3085)',
    docsUrl: 'https://api.slack.com',
  },
];

const CATEGORIES = ['All', ...new Set(INTEGRATIONS.map((i) => i.category))];

export default function Integrations() {
  const { workspaceId } = useParams();
  const { addToast } = useToast();

  const [activeCategory, setActiveCategory] = useState('All');
  const [connectedIds, setConnectedIds] = useState(['cli']); // CLI is always available
  const [detailModal, setDetailModal] = useState(null);
  const [connectingId, setConnectingId] = useState(null);

  const filteredIntegrations = activeCategory === 'All'
    ? INTEGRATIONS
    : INTEGRATIONS.filter((i) => i.category === activeCategory);

  const handleConnect = async (integration) => {
    setConnectingId(integration.id);
    // Simulate connection delay
    await new Promise((r) => setTimeout(r, 1200));
    setConnectedIds((prev) => [...prev, integration.id]);
    setConnectingId(null);
    setDetailModal(null);
    addToast(`${integration.name} connected successfully!`, 'success');
  };

  const handleDisconnect = async (integration) => {
    setConnectedIds((prev) => prev.filter((id) => id !== integration.id));
    addToast(`${integration.name} disconnected`, 'success');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="projects-page-header">
        <div className="projects-page-header-left">
          <h1 className="projects-page-title">
            <Puzzle size={24} style={{ color: 'var(--accent-secondary)' }} />
            Integrations
          </h1>
          <p className="projects-page-subtitle">
            Connect Vaultix with your favorite tools and services
          </p>
        </div>
        <div className="integrations-connected-count">
          <Check size={14} />
          <span>{connectedIds.length} connected</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="integrations-tabs animate-slide-up delay-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`integrations-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
            {cat !== 'All' && (
              <span className="integrations-tab-count">
                {INTEGRATIONS.filter((i) => i.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Integration Cards Grid */}
      <div className="integrations-grid">
        {filteredIntegrations.map((integration, i) => {
          const isConnected = connectedIds.includes(integration.id);
          const isConnecting = connectingId === integration.id;

          return (
            <div
              key={integration.id}
              className={`integrations-card animate-slide-up delay-${(i % 6) + 1} ${isConnected ? 'integrations-card--connected' : ''}`}
              onClick={() => setDetailModal(integration)}
            >
              <div className="integrations-card-header">
                <div className="integrations-card-icon" style={{ background: integration.bg, color: integration.color }}>
                  {integration.icon}
                </div>
                {isConnected && (
                  <span className="integrations-card-status">
                    <Check size={12} />
                    Connected
                  </span>
                )}
              </div>
              <div className="integrations-card-body">
                <div className="integrations-card-name">{integration.name}</div>
                <span className="integrations-card-category">{integration.category}</span>
                <p className="integrations-card-desc">{integration.desc}</p>
              </div>
              <div className="integrations-card-footer">
                {isConnected ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDisconnect(integration); }}
                    style={{ width: '100%' }}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isConnecting}
                    onClick={(e) => { e.stopPropagation(); handleConnect(integration); }}
                    style={{ width: '100%' }}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={detailModal?.name || 'Integration'}
      >
        {detailModal && (
          <div>
            <div className="modal-body" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                <div className="integrations-card-icon" style={{ background: detailModal.bg, color: detailModal.color, width: '52px', height: '52px', borderRadius: 'var(--radius-lg)' }}>
                  {detailModal.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-lg)', color: 'var(--text-primary)' }}>
                    {detailModal.name}
                  </div>
                  <span className="integrations-card-category" style={{ marginTop: '4px' }}>{detailModal.category}</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.7 }}>
                {detailModal.desc}
              </p>
              {connectedIds.includes(detailModal.id) && (
                <div className="badge badge-success" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-2) var(--space-3)' }}>
                  <Check size={12} /> Currently Connected
                </div>
              )}
            </div>
            <div className="modal-footer">
              {detailModal.docsUrl && (
                <a
                  href={detailModal.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} />
                  Docs
                </a>
              )}
              <div style={{ flex: 1 }} />
              {connectedIds.includes(detailModal.id) ? (
                <Button
                  variant="danger"
                  onClick={() => { handleDisconnect(detailModal); setDetailModal(null); }}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="primary"
                  loading={connectingId === detailModal.id}
                  onClick={() => handleConnect(detailModal)}
                >
                  Connect Integration
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
