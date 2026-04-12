'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import {
  Users, DollarSign, TrendingUp, CreditCard,
  MessageSquareWarning, BarChart3, Clock
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalCampaigns: number;
  totalTickets: number;
  totalRevenue: number;
  totalCommission: number;
  recentPayments: any[];
  recentUsers: any[];
  recentTickets: any[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCampaigns: 0,
    totalTickets: 0,
    totalRevenue: 0,
    totalCommission: 0,
    recentPayments: [],
    recentUsers: [],
    recentTickets: [],
  });
  const [loading, setLoading] = useState(true);
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET || '';

  useEffect(() => {
    fetchStats();
    fetchPendingTransfers();
  }, []);

  const fetchPendingTransfers = async () => {
    try {
      const response = await fetch('/api/admin/pending-transfers');
      if (!response.ok) return;
      const data = await response.json();
      setPendingTransfers(data.payments || []);
    } catch (e) {
      console.error('Pending transfers error:', e);
    }
  };

  const approveTransfer = async (paymentId: string) => {
    try {
      setApprovingId(paymentId);
      const response = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
      });
      if (response.ok) {
        setPendingTransfers((prev) => prev.filter((p) => p.id !== paymentId));
        fetchStats();
      }
    } catch (e) {
      console.error('Approve error:', e);
    } finally {
      setApprovingId(null);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/overview');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Admin verisi getirilemedi');
      }

      setStats({
        totalUsers: data?.stats?.totalUsers || 0,
        totalCampaigns: data?.stats?.totalCampaigns || 0,
        totalTickets: data?.stats?.totalTickets || 0,
        totalRevenue: data?.stats?.totalRevenue || 0,
        totalCommission: data?.stats?.totalCommission || 0,
        recentPayments: data?.recentPayments || [],
        recentUsers: data?.recentUsers || [],
        recentTickets: data?.recentTickets || [],
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Admin Paneli"
        subtitle="Advara platform yönetimi, müşteri ve gelir takibi"
      />

      <div className="px-8 py-8 space-y-6">

        {/* Bekleyen EFT Ödemeleri */}
        {pendingTransfers.length > 0 && (
          <Card className="animate-fade-in-up border-2 border-amber-200">
            <CardHeader
              title="Bekleyen EFT / Havale Ödemeleri"
              subtitle="Onay bekleyen banka transfer talepleri"
              icon={<Clock className="w-5 h-5 text-amber-600" />}
            />
            <div className="p-4">
              <div className="space-y-3">
                {pendingTransfers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <div>
                      <p className="font-medium text-slate-900">{p.user?.name || p.user?.email || 'Kullanıcı'}</p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                      <p className="text-xs font-mono text-amber-700 mt-0.5">Ref: {p.paymentId}</p>
                      <p className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-bold text-slate-900">₺{Math.round(p.amountWithVat || p.amount || 0).toLocaleString('tr-TR')}</p>
                      <Badge variant="yellow">{p.planType === 'pro' ? 'Pro Plan' : 'Starter Plan'}</Badge>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => approveTransfer(p.id)}
                        disabled={approvingId === p.id}
                      >
                        {approvingId === p.id ? 'Onaylanıyor...' : '✓ Onayla'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-fade-in-up">
            <CardHeader
              title="Toplam Kullanıcı"
              subtitle="Kayıtlı kullanıcı sayısı"
              icon={<Users className="w-5 h-5" />}
            />
            <div className="p-4">
              <p className="text-3xl font-bold text-slate-900">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">Toplam müşteri adedi</p>
            </div>
          </Card>

          <Card className="animate-fade-in-up">
            <CardHeader
              title="Toplam Gelir"
              subtitle="Reklam bütçelerinden"
              icon={<DollarSign className="w-5 h-5" />}
            />
            <div className="p-4">
              <p className="text-3xl font-bold text-slate-900">₺{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">Tamamlanan ödemeler</p>
            </div>
          </Card>

          <Card className="animate-fade-in-up">
            <CardHeader
              title="Komisyon Geliri"
              subtitle="%10 komisyon"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <div className="p-4">
              <p className="text-3xl font-bold text-slate-900">₺{stats.totalCommission.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">Toplam komisyon</p>
            </div>
          </Card>

          <Card className="animate-fade-in-up">
            <CardHeader
              title="Destek Talebi"
              subtitle="Müşteri mesajları"
              icon={<CreditCard className="w-5 h-5" />}
            />
            <div className="p-4">
              <p className="text-3xl font-bold text-slate-900">{stats.totalTickets.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">Açılan toplam talep</p>
            </div>
          </Card>
        </div>

        {/* Son Ödemeler */}
        <Card className="animate-fade-in-up">
          <CardHeader
            title="Son Ödemeler"
            subtitle="Müşterilerden gelen reklam bütçeleri"
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <div className="p-4">
            <div className="space-y-3">
              {stats.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{payment.user?.name || payment.user?.email || 'Kullanıcı'}</p>
                      <p className="text-sm text-slate-500">{new Date(payment.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₺{Math.round(payment.amountWithVat || payment.amount || 0).toLocaleString()}</p>
                    <p className="text-sm text-emerald-600">Komisyon: ₺{Math.round(payment.commission || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}

              {stats.recentPayments.length === 0 && (
                <p className="text-sm text-slate-500">Henüz ödeme kaydı yok.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Son Kullanıcılar */}
        <Card className="animate-fade-in-up">
          <CardHeader
            title="Son Kayıtlar"
            subtitle="Yeni katılan müşteriler"
            icon={<Users className="w-5 h-5" />}
          />
          <div className="p-4">
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="slate">
                      Kullanıcı
                    </Badge>
                    <p className="text-sm text-slate-500 mt-1">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
              ))}

              {stats.recentUsers.length === 0 && (
                <p className="text-sm text-slate-500">Henüz kullanıcı kaydı yok.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Son Mesajlar */}
        <Card className="animate-fade-in-up">
          <CardHeader
            title="Son Destek Mesajları"
            subtitle="Müşterilerden gelen son talepler"
            icon={<MessageSquareWarning className="w-5 h-5" />}
          />
          <div className="p-4">
            <div className="space-y-3">
              {stats.recentTickets.map((ticket) => (
                <div key={ticket.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{ticket.subject}</p>
                      <p className="text-xs text-slate-500">{ticket.name} - {ticket.email}</p>
                    </div>
                    <Badge variant={ticket.status === 'open' ? 'yellow' : 'green'}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{new Date(ticket.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              ))}

              {stats.recentTickets.length === 0 && (
                <p className="text-sm text-slate-500">Henüz destek talebi yok.</p>
              )}
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}