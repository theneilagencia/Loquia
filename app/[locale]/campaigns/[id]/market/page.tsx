'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { GlowCard } from '@/components/glow';
import { useUserRole } from '@/hooks/useUserRole';
import { ReadOnlyBanner } from '@/components/read-only-banner';
import { TrendingUp, Search, Globe } from 'lucide-react';

interface MarketAnalysis {
  id: string;
  keywords: string[];
  competitors: string[];
  regions: string[];
  status: 'running' | 'completed' | 'failed';
  results: any;
  created_at: string;
}

export default function MarketAnalysisPage() {
  const t = useTranslations('market');
  const tCommon = useTranslations('common');
  const params = useParams();
  const { isReadOnly } = useUserRole();

  const [analyses, setAnalyses] = useState<MarketAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    fetchAnalyses();
  }, [params.id]);

  const fetchAnalyses = async () => {
    try {
      const res = await fetch(`/api/campaigns/${params.id}/market-analysis`);
      const data = await res.json();
      setAnalyses(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCreateAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim()) return;

    setCreating(true);
    setError('');

    try {
      const res = await fetch(`/api/campaigns/${params.id}/market-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords.split(',').map(k => k.trim()),
          regions: ['BR'],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create analysis');
      }

      setKeywords('');
      await fetchAnalyses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="text-white">{tCommon('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <ReadOnlyBanner />
      <PageHeader title={t('title')} />

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Formulário de nova análise */}
      {!isReadOnly && (
        <GlowCard>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            {t('newAnalysis')}
          </h3>
          <form onSubmit={handleCreateAnalysis} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('keywords')}
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={t('keywordsPlaceholder')}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('keywordsHint')}</p>
            </div>
            <button
              type="submit"
              disabled={creating || !keywords.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {creating ? tCommon('loading') : t('startAnalysis')}
            </button>
          </form>
        </GlowCard>
      )}

      {/* Lista de análises */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('previousAnalyses')}</h3>
        
        {analyses.length === 0 ? (
          <GlowCard>
            <p className="text-gray-500">{t('noAnalyses')}</p>
          </GlowCard>
        ) : (
          analyses.map((analysis) => (
            <GlowCard key={analysis.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-500">
                    {new Date(analysis.created_at).toLocaleString()}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  analysis.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  analysis.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {t(`status.${analysis.status}`)}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-400">{t('keywords')}:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {analysis.keywords.map((kw, i) => (
                      <span key={i} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {analysis.regions && analysis.regions.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-400">{t('regions')}:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {analysis.regions.map((region, i) => (
                        <span key={i} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.status === 'completed' && analysis.results && (
                  <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">{t('results')}:</p>
                    <pre className="text-xs text-gray-300 overflow-auto max-h-40">
                      {JSON.stringify(analysis.results, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </GlowCard>
          ))
        )}
      </div>
    </div>
  );
}
