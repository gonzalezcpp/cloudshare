import Link from 'next/link';
import { ArrowRight, Shield, Share2, HardDrive } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/">
            <BrandLogo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/25"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-full text-sm font-medium text-cyan-700 dark:text-cyan-300 mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Free &middot; No credit card required
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Secure file sharing{' '}
            <span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">
              made simple
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
            Store, manage, and share your files with optional PIN protection.
            Your files, your control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30"
            >
              Start for free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold rounded-xl transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="group bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-7 shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/25 group-hover:scale-110 transition-transform">
              <HardDrive className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Cloud Storage
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Store your files securely in the cloud with fast global CDN delivery.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-7 shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Easy Sharing
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Share files with anyone using secure links. No account required for downloads.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-7 shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              PIN Protection
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Add an extra layer of security with optional 6-character PIN protection.
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-gray-200/60 dark:border-gray-800/60">
        <p className="text-center text-gray-500 dark:text-gray-500 text-sm">
          &copy; 2026 <span className="text-cyan-500 font-medium">Cloud</span><span className="text-violet-500 font-medium">Share</span>. Secure file storage and sharing.
        </p>
      </footer>
    </div>
  );
}
