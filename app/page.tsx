import Link from 'next/link';
import { ArrowRight, BarChart3, ShieldCheck, Sparkles, Target } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="flex items-center justify-between">
          <p className="text-sm sm:text-base font-semibold tracking-wide text-blue-300">Advara</p>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Giriş
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>

        <div className="mt-14 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-400/10 border border-emerald-300/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Kendi reklamını kendin yönet
            </p>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
              Ajansa bağımlı kalmadan,
              <span className="block text-blue-300"> reklam bütçeni daha akıllı yönet.</span>
            </h1>
            <p className="mt-5 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Advara, işletmenin hedefini ve bütçesini analiz eder; hangi mecraya neden bütçe ayırman gerektiğini
              anlaşılır şekilde açıklar. Böylece tahminle değil, gerekçeli bir planla reklam verirsin.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors font-semibold"
              >
                Hemen Başla
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors font-semibold"
              >
                Hesabım Var
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-wide font-semibold text-blue-300">Hakkımızda</p>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Advara, küçük ve orta ölçekli işletmelerin dijital reklam kararlarını uzman jargonu olmadan
                yönetebilmesi için geliştirildi. Hedefimiz, reklamı karmaşık bir masraf kalemi olmaktan çıkarıp
                ölçülebilir bir büyüme kanalına dönüştürmek.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-wide font-semibold text-blue-300">Ne İşe Yarar?</p>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Kampanya hedefini belirlediğinde sistem sana platform bazlı bütçe planı, hedef kitle yaklaşımı ve
                içerik önerisi üretir. Neden Google, neden Meta, ne kadar pay gibi sorulara açık cevap verir.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Target,
              title: 'Net Hedefleme',
              text: 'Bütçeyi sadece müşteri potansiyeli yüksek alanlara yönlendir.',
            },
            {
              icon: BarChart3,
              title: 'Açıklanabilir Plan',
              text: 'Her bütçe oranı için neden-sonuç mantığını tek ekranda gör.',
            },
            {
              icon: ShieldCheck,
              title: 'Kontrol Sende',
              text: 'Tüm kararları panelden sen yönet, dış bağımlılığı azalt.',
            },
            {
              icon: Sparkles,
              title: 'Hızlı Uygulama',
              text: 'Dakikalar içinde reklam planı oluşturup aksiyona geç.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <item.icon className="w-5 h-5 text-blue-300" />
              <p className="mt-3 font-semibold text-sm">{item.title}</p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
