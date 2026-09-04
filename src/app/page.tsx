import Link from 'next/link';
import { ArrowRight, Shield, Share2, HardDrive } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
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
              className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center pt-32 pb-24">
          <h1 className="text-[3.5rem] leading-[1.1] font-bold text-gray-900 tracking-tight">
            Store files.
            <br />
            Share them.
            <br />
            <span className="text-gray-400">Keep them safe.</span>
          </h1>
          <p className="text-lg text-gray-500 mt-6 max-w-md mx-auto leading-relaxed">
            Upload, organize, and share files with optional PIN-protected links. 
            Simple and secure.
          </p>
          <div className="flex items-center gap-3 justify-center mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden max-w-4xl mx-auto mb-24">
          <div className="bg-white p-8">
            <HardDrive className="h-5 w-5 text-gray-900 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1.5">
              Cloud Storage
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Files stored on global CDN for fast access from anywhere.
            </p>
          </div>

          <div className="bg-white p-8">
            <Share2 className="h-5 w-5 text-gray-900 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1.5">
              Share Links
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Generate shareable links. No account needed to download.
            </p>
          </div>

          <div className="bg-white p-8">
            <Shield className="h-5 w-5 text-gray-900 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1.5">
              PIN Protection
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Optional 6-character PIN for extra security on sensitive files.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100">
        <div className="container mx-auto px-6 py-6">
          <p className="text-sm text-gray-400">
            &copy; 2026 <span className="font-medium" style={{ color: '#38bdf8' }}>Cloud</span><span className="font-medium" style={{ color: '#a78bfa' }}>Share</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
