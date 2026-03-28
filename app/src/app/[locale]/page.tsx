import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');
  const tPlans = useTranslations('plans');
  const tNav = useTranslations('nav');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <section className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">{t('hero.headline')}</h1>
        <p className="text-lg text-gray-600 mb-8">{t('hero.subheadline')}</p>
        <a
          href="#plans"
          className="inline-block bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
        >
          {t('hero.cta')}
        </a>
      </section>

      <section id="plans" className="mt-24 w-full max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-4">{tPlans('title')}</h2>
        <p className="text-center text-gray-500 mb-12">{tPlans('subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(['starter', 'essential', 'premium'] as const).map((plan) => (
            <div
              key={plan}
              className="border rounded-2xl p-8 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{tPlans(`${plan}.name` as any)}</h3>
              <p className="text-gray-500 text-sm mb-4">{tPlans(`${plan}.description` as any)}</p>
              <p className="text-3xl font-bold mb-6">
                {tPlans(`${plan}.price` as any)}
                <span className="text-base font-normal text-gray-500">
                  {tPlans('perMonth')}
                </span>
              </p>
              <a
                href={`/${tNav('register')}`}
                className="w-full text-center bg-black text-white py-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                {tPlans('cta')}
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
