'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { GlowCard } from '@/components/glow';
import { useUserRole } from '@/hooks/useUserRole';
import { ReadOnlyBanner } from '@/components/read-only-banner';
import { Phone, Clock, FileText, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface VoiceInteraction {
  id: string;
  phone_number: string;
  status: string;
  duration_seconds: number;
  transcript: string;
  recording_url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  created_at: string;
}

export default function VoiceInteractionsPage() {
  const t = useTranslations('voice');
  const tCommon = useTranslations('common');
  const params = useParams();
  const { isReadOnly } = useUserRole();

  const [interactions, setInteractions] = useState<VoiceInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchInteractions();
  }, [params.id]);

  const fetchInteractions = async () => {
    try {
      const res = await fetch(`/api/campaigns/${params.id}/voice`);
      const data = await res.json();
      setInteractions(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setCalling(true);
    setError('');

    try {
      const res = await fetch(`/api/campaigns/${params.id}/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start call');
      }

      setPhoneNumber('');
      await fetchInteractions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCalling(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="w-4 h-4 text-green-400" />;
      case 'negative':
        return <ThumbsDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
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

      {/* Formulário de nova chamada */}
      {!isReadOnly && (
        <GlowCard>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {t('newCall')}
          </h3>
          <form onSubmit={handleStartCall} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('phoneNumber')}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('phoneNumberPlaceholder')}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={calling || !phoneNumber.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {calling ? tCommon('loading') : t('startCall')}
            </button>
          </form>
        </GlowCard>
      )}

      {/* Lista de interações */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('callHistory')}</h3>
        
        {interactions.length === 0 ? (
          <GlowCard>
            <p className="text-gray-500">{t('noCalls')}</p>
          </GlowCard>
        ) : (
          interactions.map((interaction) => (
            <GlowCard key={interaction.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">{interaction.phone_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(interaction.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  interaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  interaction.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                  interaction.status === 'failed' || interaction.status === 'no_answer' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {t(`status.${interaction.status}`)}
                </span>
              </div>

              {interaction.duration_seconds && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor(interaction.duration_seconds / 60)}:{(interaction.duration_seconds % 60).toString().padStart(2, '0')}</span>
                </div>
              )}

              {interaction.sentiment && (
                <div className="flex items-center gap-2 mb-3">
                  {getSentimentIcon(interaction.sentiment)}
                  <span className="text-sm text-gray-400">{t(`sentiment.${interaction.sentiment}`)}</span>
                </div>
              )}

              {interaction.transcript && (
                <div className="mt-3 p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{t('transcript')}:</span>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{interaction.transcript}</p>
                </div>
              )}

              {interaction.recording_url && (
                <div className="mt-3">
                  <audio controls className="w-full">
                    <source src={interaction.recording_url} type="audio/mpeg" />
                  </audio>
                </div>
              )}
            </GlowCard>
          ))
        )}
      </div>
    </div>
  );
}
