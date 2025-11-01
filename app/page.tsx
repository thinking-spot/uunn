import Link from "next/link";
import { Shield, Users, FileText, Lock, Network } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">uunn</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/about" className="text-sm hover:text-blue-600">About</Link>
            <Link href="/privacy" className="text-sm hover:text-blue-600">Privacy</Link>
            <Link href="/get-started" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Get Started</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">
          Build Collective Power
          <br />
          <span className="text-blue-600">Privately & Securely</span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          uunn is a privacy-first platform that enables workers to coordinate on workplace issues
          without requiring formal unionization. Organize with confidence.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/create-group"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Create a Group
          </Link>
          <Link
            href="/join"
            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Join a Group
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Core Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 border rounded-lg hover:shadow-lg transition">
              <Lock className="h-12 w-12 text-blue-600 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Secure Messaging</h4>
              <p className="text-gray-600 dark:text-gray-300">
                End-to-end encrypted workplace discussions. Server never sees your messages.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 border rounded-lg hover:shadow-lg transition">
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Action Templates</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Pre-built frameworks for proposals, votes, and collective demands.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 border rounded-lg hover:shadow-lg transition">
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Document Generation</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Create petitions and grievance forms client-side. Never touch our servers.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 border rounded-lg hover:shadow-lg transition">
              <Network className="h-12 w-12 text-blue-600 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Transparent Invites</h4>
              <p className="text-gray-600 dark:text-gray-300">
                See who invited whom. Build trust through visible organizing networks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Create a Workplace Group</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  A worker creates an encrypted group for their workplace using a pseudonym.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Invite Coworkers</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Share invite codes through trusted channels. Each invitation is visible in the organizing graph.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Discuss & Coordinate</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Workers communicate privately about workplace issues with end-to-end encryption.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Take Action</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Create proposals, gather votes, generate documents, and coordinate collective action.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-16 w-16 mx-auto mb-6" />
          <h3 className="text-3xl font-bold mb-4">Privacy First, Always</h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            All sensitive data is encrypted on your device. We never see your messages,
            documents, or organizing activity. Open source and community-auditable.
          </p>
          <Link
            href="/privacy"
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition inline-block"
          >
            Read Our Privacy Policy
          </Link>
        </div>
      </section>

      {/* Legal Protection */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">Protected by Law</h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Section 7 of the National Labor Relations Act (NLRA) protects your right to engage in
            "concerted activity" for "mutual aid or protection"—even without a union.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">Built by workers, for workers</p>
          <p>uunn is a non-profit, open-source platform</p>
          <div className="mt-4 flex gap-4 justify-center">
            <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-600">Terms of Service</Link>
            <Link href="/legal-resources" className="hover:text-blue-600">Legal Resources</Link>
            <a href="https://github.com/uunn" className="hover:text-blue-600" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
