'use client';

import { useState } from 'react';
import { MessageSquareWarning, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    category: 'complaint',
    subject: 'Iletisim Formu',
    message: '',
  });

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Talep gönderilemedi');
      }

      setSuccess(data?.ticketId ? `Talebiniz alındı. Takip No: ${data.ticketId}` : 'Talebiniz alındı.');
      setForm({
        name: '',
        phone: '',
        email: '',
        category: 'complaint',
        subject: 'Iletisim Formu',
        message: '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Talep gönderilemedi';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Iletisim" subtitle="Sikayet ve onerilerinizi buraya yazin" />

      <div className="px-8 py-8 max-w-3xl">
        <Card>
          <CardHeader
            title="Sikayet ve Oneri Formu"
            subtitle="Numara birakin, mail birakin, mesajinizi yazin"
            icon={<MessageSquareWarning className="w-4 h-4" />}
          />

          <form onSubmit={submit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ad Soyad"
                value={form.name}
                onChange={update('name')}
                placeholder="Adiniz"
                required
              />

              <Input
                label="Telefon"
                value={form.phone}
                onChange={update('phone')}
                placeholder="05xx xxx xx xx"
                required
              />

              <Input
                label="E-posta"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="mail@ornek.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Mesaj</label>
              <textarea
                value={form.message}
                onChange={update('message')}
                placeholder="Detaylari adim adim yazin"
                rows={6}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            {success && (
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl border border-red-200 bg-red-50 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" loading={loading} icon={!loading ? <Send className="w-4 h-4" /> : undefined}>
                Talep Gonder
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
