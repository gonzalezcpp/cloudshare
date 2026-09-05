import Link from 'next/link';
import { ArrowRight, Shield, Share2, HardDrive, Upload, Lock, Globe } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <header className="border-b border-gray-200/60 bg-white/70 backdrop-blur-sm sticky top-0 z-50">
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
              className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <div className="relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          {/* Soft gradient blobs */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />

          <div className="relative max-w-3xl mx-auto text-center pt-28 pb-20 px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Now with PIN-protected sharing
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1]">
              Store files.
              <br />
              Share them.
              <br />
              <span className="text-gray-400">Keep them safe.</span>
            </h1>

            <p className="text-lg text-gray-500 mt-7 max-w-lg mx-auto leading-relaxed">
              Upload, organize, and share files with optional PIN-protected links.
              Simple and secure.
            </p>

            <div className="flex items-center gap-3 justify-center mt-10">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-all shadow-md hover:shadow-lg"
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
        </div>

        {/* Features */}
        <div className="container mx-auto px-6 pb-28">
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <FeatureCard
              icon={<Upload className="h-5 w-5" />}
              title="Cloud Storage"
              desc="Files stored on global CDN for fast access from anywhere."
            />
            <FeatureCard
              icon={<Globe className="h-5 w-5" />}
              title="Share Links"
              desc="Generate shareable links. No account needed to download."
            />
            <FeatureCard
              icon={<Lock className="h-5 w-5" />}
              title="PIN Protection"
              desc="Optional 6-character PIN for extra security on sensitive files."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="container mx-auto px-6 pb-28">
          <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Create a free account and start sharing files in seconds.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm"
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
            &copy; 2026 <span className="font-medium" style={{ color: '#38bdf8' }}>Cloud</span><span className="font-medium" style={{ color: '#a78bfa' }}>Share</span>
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

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-7 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
