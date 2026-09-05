import Link from 'next/link';
import { ArrowRight, Shield, Globe, Upload, Lock, CheckCircle } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="border-b border-gray-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <BrandLogo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg transition-colors shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, #2563eb 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#2563eb]/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-[#7c3aed]/5 rounded-full blur-3xl" />

          <div className="relative container mx-auto px-6 pt-20 pb-16">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-8 shadow-sm">
                  <Shield className="h-3.5 w-3.5 text-[#2563eb]" />
                  New with PIN-protected sharing
                </div>

                <h1 className="text-5xl sm:text-[3.5rem] font-bold text-[#0f172a] tracking-tight leading-[1.1]">
                  Store files.
                  <br />
                  Share them.
                  <br />
                  <span className="text-[#2563eb]">Keep them safe.</span>
                </h1>

                <p className="text-lg text-gray-500 mt-7 leading-relaxed">
                  Upload, organize, and share files with optional PIN-protected links.
                  Simple and secure.
                </p>

                <div className="flex items-center gap-3 mt-10">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Start for free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:border-gray-400 rounded-lg transition-colors shadow-sm"
                  >
                    Sign in
                  </Link>
                </div>
              </div>

              {/* Hero illustration */}
              <div className="flex-1 hidden lg:flex justify-center">
                <div className="relative w-[420px] h-[360px]">
                  {/* Cloud with folder */}
                  <div className="absolute top-0 right-0 w-72 h-52 bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 rounded-3xl border border-[#2563eb]/10 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-24 h-20 bg-[#2563eb]/20 rounded-xl flex items-center justify-center">
                        <div className="w-16 h-14 bg-[#2563eb] rounded-lg flex items-center justify-center shadow-lg shadow-[#2563eb]/30">
                          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Lock icon */}
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center">
                      <Lock className="h-7 w-7 text-[#2563eb]" />
                    </div>
                    {/* Check icon */}
                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#10b981] rounded-xl shadow-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="container mx-auto px-6 pb-20">
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <FeatureCard
              icon={<Upload className="h-5 w-5 text-[#2563eb]" />}
              title="Cloud Storage"
              desc="Files stored on global CDN for fast access from anywhere."
              iconBg="bg-[#2563eb]/10"
            />
            <FeatureCard
              icon={<Globe className="h-5 w-5 text-[#7c3aed]" />}
              title="Share Links"
              desc="Generate shareable links. No account needed to download."
              iconBg="bg-[#7c3aed]/10"
            />
            <FeatureCard
              icon={<Lock className="h-5 w-5 text-[#10b981]" />}
              title="PIN Protection"
              desc="Optional 6-character PIN for extra security on sensitive files."
              iconBg="bg-[#10b981]/10"
            />
          </div>
        </div>

        {/* Security section */}
        <div className="container mx-auto px-6 pb-20">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 bg-[#2563eb]/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-[#2563eb]" />
                </div>
                <h2 className="text-xl font-bold text-[#0f172a] mb-2">Security you can trust</h2>
                <p className="text-gray-500 text-sm mb-5">
                  We use industry-standard encryption to keep your files safe and private.
                </p>
                <ul className="space-y-2.5">
                  {['End-to-end encryption', 'Optional PIN protection', 'Secure and private sharing'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-[#2563eb] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-shrink-0 hidden md:block">
                <div className="w-40 h-40 bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 rounded-3xl flex items-center justify-center">
                  <Shield className="h-16 w-16 text-[#2563eb]/40" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="container mx-auto px-6 pb-20">
          <div className="max-w-4xl mx-auto bg-[#0f172a] rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#2563eb]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#7c3aed]/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Create a free account and start sharing files in seconds.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#0f172a] bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm"
              >
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200/60 bg-white/50">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            &copy; 2026 <span className="font-medium" style={{ color: '#2563eb' }}>Cloud</span><span className="font-medium" style={{ color: '#7c3aed' }}>Share</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-gray-600 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, iconBg }: { icon: React.ReactNode; title: string; desc: string; iconBg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-7 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold text-[#0f172a] mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
