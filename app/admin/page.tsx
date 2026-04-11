'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Header } from '@/components/layout/Header';
import {
  Users, DollarSign, TrendingUp, CreditCard,
  Calendar, Target, BarChart3
} from 'lucide-react';
import { prisma } from '@/lib/prisma';

interface Stats {
  totalUsers: number;
  totalRevenue: number;
  totalCommission: number;
  recentPayments: any[];
  recentUsers: any[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRevenue: 0,
    totalCommission: 0,
    recentPayments: [],
    recentUsers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Bu kısım server component'ta çalışmalı ama şimdilik mock data
      setStats({
        totalUsers: 47,
        totalRevenue: 705000, // 47 user × 15,000₺
        totalCommission: 70500, // %10 komisyon
        recentPayments: [
          { id: '1', user: 'Ahmet Yılmaz', amount: 15000, date: '2024-01-15' },
          { id: '2', user: 'Ayşe Kaya', amount: 15000, date: '2024-01-14' },
          { id: '3', user: 'Mehmet Demir', amount: 15000, date: '2024-01-13' },
        ],
        recentUsers: [
          { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', plan: 'starter', joinedAt: '2024-01-15' },
          { id: '2', name: 'Ayşe Kaya', email: 'ayse@example.com', plan: 'pro', joinedAt: '2024-01-14' },
          { id: '3', name: 'Mehmet Demir', email: 'mehmet@example.com', plan: 'starter', joinedAt: '2024-01-13' },
        ]
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
        subtitle="ADPILOT platform yönetimi ve gelir takibi"
      />

      <div className="px-8 py-8 space-y-6">

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
              <p className="text-sm text-emerald-600 mt-1">+12% bu ay</p>
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
              <p className="text-sm text-emerald-600 mt-1">+15% bu ay</p>
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
              <p className="text-sm text-emerald-600 mt-1">Net kar</p>
            </div>
          </Card>

          <Card className="animate-fade-in-up">
            <CardHeader
              title="Stripe Maliyeti"
              subtitle="Güvenilir payment gateway"
              icon={<CreditCard className="w-5 h-5" />}
            />
            <div className="p-4">
              <p className="text-3xl font-bold text-slate-900">₺{Math.round(stats.totalUsers * 25).toLocaleString()}</p>
              <p className="text-sm text-emerald-600 mt-1">~25₺/ödeme (çok düşük)</p>
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
                      <p className="font-medium text-slate-900">{payment.user}</p>
                      <p className="text-sm text-slate-500">{payment.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₺{payment.amount.toLocaleString()}</p>
                    <p className="text-sm text-emerald-600">Komisyon: ₺{Math.round(payment.amount * 0.1).toLocaleString()}</p>
                  </div>
                </div>
              ))}
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
                    <Badge variant={user.plan === 'pro' ? 'blue' : 'slate'}>
                      {user.plan === 'pro' ? 'Pro' : 'Starter'}
                    </Badge>
                    <p className="text-sm text-slate-500 mt-1">{user.joinedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Kar Analizi */}
        <Card className="animate-fade-in-up">
          <CardHeader
            title="Kar Analizi (50 Müşteri)"
            subtitle="Aylık gelir ve gider hesaplaması"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Gelirler</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Reklam Bütçeleri (50×15,000₺)</span>
                    <span className="font-medium">₺750,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Abonelik Geliri (50×50₺)</span>
                    <span className="font-medium">₺2,500</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Toplam Gelir</span>
                      <span>₺752,500</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Giderler</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">OpenAI API (50×50₺)</span>
                    <span className="font-medium">₺2,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Stripe Komisyonu (%3.5)</span>
                    <span className="font-medium">₺26,250</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Vercel Hosting</span>
                    <span className="font-medium">₺500</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Toplam Gider</span>
                      <span>₺29,250</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-emerald-900">Net Kar: ₺723,250/ay</h4>
              </div>
              <p className="text-sm text-emerald-700">
                Stripe + OpenAI sistemi ile aylık 723 bin ₺ net kar! İyzico'ya göre daha güvenilir,
                daha az chargeback riski ve otomatik subscription yönetimi.
              </p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}