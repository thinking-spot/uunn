import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Privacy Policy</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl prose dark:prose-invert">
        <p className="lead">
          Effective Date: November 1, 2025
        </p>

        <p>
          uunn is committed to protecting worker privacy. This Privacy Policy explains how we handle
          your data and why we can be trusted to protect your right to organize.
        </p>

        <h2>Our Privacy Principles</h2>

        <ol>
          <li><strong>Privacy First</strong> - We never see your messages, documents, or identities</li>
          <li><strong>Worker Control</strong> - You own and control your data</li>
          <li><strong>No Surveillance</strong> - We don't track, profile, or monitor you</li>
          <li><strong>No Data Sales</strong> - We will never sell your data</li>
          <li><strong>Open Source</strong> - Our code is auditable by the community</li>
        </ol>

        <h2>What We Don't See (By Design)</h2>

        <p>
          uunn uses <strong>end-to-end encryption</strong> to ensure that we, as the platform provider,
          cannot access your sensitive data:
        </p>

        <ul>
          <li><strong>Messages</strong> - All messages are encrypted on your device before sending</li>
          <li><strong>Documents</strong> - Petitions, grievances, and demands are generated locally</li>
          <li><strong>Identities</strong> - We only see pseudonyms, not real names</li>
          <li><strong>Organizing Activity</strong> - What you discuss and coordinate remains private</li>
        </ul>

        <h2>What We Do See</h2>

        <p>
          To operate the platform, we must process some metadata:
        </p>

        <ul>
          <li><strong>Group IDs</strong> - Identifiers for workplace groups</li>
          <li><strong>Pseudonyms</strong> - The names you choose (not real names)</li>
          <li><strong>Public Keys</strong> - For encrypting messages to you</li>
          <li><strong>Timestamps</strong> - When messages and actions occur</li>
          <li><strong>Invite Codes</strong> - For group access control</li>
        </ul>

        <p className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
          <strong>Important:</strong> This metadata is necessary for the platform to function,
          but it reveals nothing about the content of your communications or organizing activity.
        </p>

        <h2>How Encryption Works</h2>

        <h3>Client-Side Encryption</h3>

        <p>
          All encryption happens on your device using the <strong>Web Crypto API</strong>:
        </p>

        <ol>
          <li>When you create an identity, your device generates encryption keys</li>
          <li>Your private key never leaves your device</li>
          <li>Messages are encrypted before sending to our servers</li>
          <li>Only recipients with the correct keys can decrypt messages</li>
        </ol>

        <h3>Technical Details</h3>

        <ul>
          <li><strong>Key Exchange:</strong> RSA-OAEP with 2048-bit keys</li>
          <li><strong>Message Encryption:</strong> AES-GCM with 256-bit keys</li>
          <li><strong>Password Derivation:</strong> PBKDF2 with 100,000 iterations</li>
          <li><strong>Random Generation:</strong> Cryptographically secure random (CSPRNG)</li>
        </ul>

        <h2>Data Storage</h2>

        <h3>Client-Side (Your Device)</h3>

        <p>
          Sensitive data is stored locally in your browser's IndexedDB:
        </p>

        <ul>
          <li>Your encryption keys</li>
          <li>Decrypted messages</li>
          <li>Group information</li>
          <li>Action templates and documents</li>
        </ul>

        <h3>Server-Side (Cloudflare)</h3>

        <p>
          Our servers store only encrypted metadata in Cloudflare D1:
        </p>

        <ul>
          <li>Group metadata (IDs, timestamps)</li>
          <li>Member pseudonyms and public keys</li>
          <li>Encrypted message hashes (for sync)</li>
          <li>Invite codes</li>
        </ul>

        <h2>Data Retention</h2>

        <ul>
          <li><strong>Messages:</strong> Stored locally on your device, you control retention</li>
          <li><strong>Metadata:</strong> Retained while groups are active</li>
          <li><strong>Deleted Groups:</strong> Metadata purged within 30 days</li>
          <li><strong>Audit Logs:</strong> Retained for 90 days for security purposes</li>
        </ul>

        <h2>What We Don't Do</h2>

        <ul>
          <li>❌ We don't use analytics or tracking cookies</li>
          <li>❌ We don't sell data to third parties</li>
          <li>❌ We don't share data with employers</li>
          <li>❌ We don't profile or target users</li>
          <li>❌ We don't serve advertisements</li>
          <li>❌ We don't use AI to analyze your communications</li>
        </ul>

        <h2>Third-Party Services</h2>

        <p>
          We use minimal third-party services:
        </p>

        <ul>
          <li><strong>Cloudflare Pages:</strong> Website hosting and CDN</li>
          <li><strong>Cloudflare Workers:</strong> Serverless API backend</li>
          <li><strong>Cloudflare D1:</strong> Metadata database</li>
        </ul>

        <p>
          All of these services are configured for maximum privacy and minimal data collection.
        </p>

        <h2>Legal Requests</h2>

        <p>
          If we receive a legal request for user data:
        </p>

        <ol>
          <li>We can only provide metadata (pseudonyms, timestamps, group IDs)</li>
          <li>We cannot provide message content (it's encrypted)</li>
          <li>We will notify affected users unless legally prohibited</li>
          <li>We will challenge overly broad or unjust requests</li>
        </ol>

        <p className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
          <strong>Worker Protection:</strong> We are committed to protecting workers' right to organize.
          We will resist requests that threaten this right.
        </p>

        <h2>Security Measures</h2>

        <ul>
          <li>End-to-end encryption for all sensitive data</li>
          <li>HTTPS everywhere (TLS 1.3)</li>
          <li>Secure HTTP headers (CSP, HSTS, etc.)</li>
          <li>Regular security audits</li>
          <li>Open source for community review</li>
        </ul>

        <h2>Your Rights</h2>

        <p>
          As a uunn user, you have the right to:
        </p>

        <ul>
          <li>Access your data (stored locally on your device)</li>
          <li>Export your data (backup feature)</li>
          <li>Delete your data (account deletion)</li>
          <li>Control who sees your information (group membership)</li>
          <li>Organize without surveillance</li>
        </ul>

        <h2>Children's Privacy</h2>

        <p>
          uunn is intended for workers aged 16 and older. We do not knowingly collect data from
          children under 16.
        </p>

        <h2>Changes to This Policy</h2>

        <p>
          We may update this Privacy Policy from time to time. We will notify users of significant
          changes via the platform. Continued use constitutes acceptance of the updated policy.
        </p>

        <h2>Contact Us</h2>

        <p>
          Questions about privacy? Contact us at:
        </p>

        <ul>
          <li>Email: privacy@uunn.org</li>
          <li>GitHub: <a href="https://github.com/uunn/uunn/issues">github.com/uunn/uunn/issues</a></li>
        </ul>

        <h2>Open Source Transparency</h2>

        <p>
          Our encryption and privacy implementations are open source and available for audit:
        </p>

        <ul>
          <li><a href="https://github.com/uunn/uunn">GitHub Repository</a></li>
          <li>lib/crypto.ts - Encryption utilities</li>
          <li>lib/storage.ts - Local storage management</li>
          <li>schema.sql - Database schema (metadata only)</li>
        </ul>

        <hr />

        <p className="text-center">
          <strong>Built by workers, for workers. Your privacy is our mission.</strong>
        </p>
      </div>
    </div>
  );
}
