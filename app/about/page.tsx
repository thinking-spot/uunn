import Link from "next/link";
import { Shield, ArrowLeft, Heart, Users, Lock, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
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
            <h1 className="text-xl font-bold">About uunn</h1>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Built by workers, for workers</h2>
          <p className="text-xl text-muted-foreground">
            uunn is a privacy-first platform that empowers workers to coordinate on workplace issues
            and build collective power—without compromising safety or privacy.
          </p>
        </div>

        {/* Mission */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">
              Workers everywhere deserve accessible, private tools to coordinate on workplace issues.
              Whether you're organizing for better pay, safer conditions, or fair treatment, you
              shouldn't have to choose between privacy and collective action.
            </p>
            <p className="text-lg">
              uunn fills the gap between employer-controlled platforms (Slack, Teams) and traditional
              union organizing. We provide purpose-built tools that respect workers' right to organize
              while protecting them from surveillance and retaliation.
            </p>
          </CardContent>
        </Card>

        {/* Core Values */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6 text-center">Our Values</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Lock className="h-8 w-8 text-blue-600" />
                  <CardTitle>Privacy First</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p>
                  End-to-end encryption ensures that only you and your coworkers can see your messages,
                  documents, and organizing activity. We can't see it, and neither can your employer.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <CardTitle>Worker Control</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p>
                  The platform serves workers, not employers or advertisers. You own your data,
                  control your groups, and decide who participates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Code className="h-8 w-8 text-blue-600" />
                  <CardTitle>Open Source</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p>
                  Our security-critical code is open source and auditable. Transparency builds trust,
                  and community review ensures we keep our promises.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-blue-600" />
                  <CardTitle>Non-Profit</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p>
                  We operate as a non-profit entity. No data sales, no surveillance capitalism,
                  no advertising. Our only goal is empowering workers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* The Gap We Fill */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">The Gap We Fill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-bold mb-2">Existing Solutions Fall Short:</h4>
              <ul className="space-y-2 ml-6 list-disc">
                <li>
                  <strong>Employer-controlled platforms (Slack, Teams):</strong> Monitored, surveilled,
                  and controlled by management. Not safe for organizing.
                </li>
                <li>
                  <strong>Traditional unions:</strong> Require external organizers, formal processes,
                  and often inaccessible to gig workers, contractors, and small shops.
                </li>
                <li>
                  <strong>Petition platforms (Change.org):</strong> Public, extractive data practices,
                  no coordination tools, and no privacy.
                </li>
                <li>
                  <strong>General chat apps (WhatsApp, Signal):</strong> Not built for organizing,
                  fragment into small groups, lack action templates and coordination tools.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-2">uunn's Unique Approach:</h4>
              <ul className="space-y-2 ml-6 list-disc">
                <li>Purpose-built for workplace organizing</li>
                <li>End-to-end encrypted for maximum privacy</li>
                <li>Accessible without external organizers</li>
                <li>Action templates for proposals, petitions, and demands</li>
                <li>Transparent invitation system to build trust</li>
                <li>Free for all workers—no fees, no data sales</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 text-center">
          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">90%</div>
              <p className="text-sm text-muted-foreground">
                of US workers are not union members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
              <p className="text-sm text-muted-foreground">
                free for all workers—forever
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">0</div>
              <p className="text-sm text-muted-foreground">
                messages seen by our servers (E2E encrypted)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Who We Serve */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Who We Serve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2">Primary Users:</h4>
                <p>Non-union workers organizing their first collective action in traditional workplaces.</p>
              </div>

              <div>
                <h4 className="font-bold mb-2">Secondary Users:</h4>
                <p>Gig workers, contractors, informal collectives who lack access to traditional organizing infrastructure.</p>
              </div>

              <div>
                <h4 className="font-bold mb-2">Future Users:</h4>
                <p>Established unions using the platform for member coordination and inter-union organizing.</p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Not For:</h4>
                <p>Employers, HR departments, union-busting consultants, or anyone seeking to undermine workers' rights.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold mb-3">Phase 1: Foundation (Current)</h4>
                <ul className="space-y-1 ml-6 list-disc">
                  <li>Core encryption and security infrastructure</li>
                  <li>Group creation and secure messaging</li>
                  <li>Invitation system with transparency</li>
                  <li>Action templates (proposals, petitions, grievances)</li>
                  <li>Client-side document generation</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-3">Phase 2: Growth</h4>
                <ul className="space-y-1 ml-6 list-disc">
                  <li>Multi-device sync</li>
                  <li>Mobile apps (iOS, Android)</li>
                  <li>Real-time message synchronization</li>
                  <li>Enhanced action templates and voting</li>
                  <li>Offline-first architecture for warehouses</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-3">Phase 3: Movement Infrastructure</h4>
                <ul className="space-y-1 ml-6 list-disc">
                  <li>Multi-workplace coordination features</li>
                  <li>Inter-union communication tools</li>
                  <li>Legal resource library expansion</li>
                  <li>Strike coordination capabilities</li>
                  <li>General strike readiness tools</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Involved */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Get Involved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-bold mb-2">Use the Platform</h4>
              <p className="mb-3">
                The best way to support uunn is to use it for organizing your workplace.
              </p>
              <div className="flex gap-3">
                <Link href="/create-group">
                  <Button>Create a Group</Button>
                </Link>
                <Link href="/join">
                  <Button variant="outline">Join a Group</Button>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-2">Contribute Code</h4>
              <p>
                We're open source! Contribute features, fix bugs, or audit our security.
              </p>
              <a
                href="https://github.com/uunn/uunn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                github.com/uunn/uunn
              </a>
            </div>

            <div>
              <h4 className="font-bold mb-2">Spread the Word</h4>
              <p>
                Tell your coworkers, share on social media, and help other workers discover uunn.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-2">Support Development</h4>
              <p>
                As a non-profit, we rely on donations and grants to continue development.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-2xl font-bold mb-2">Organize. Coordinate. Build power.</p>
          <p className="text-muted-foreground">
            Built by workers, for workers. Privacy-first, always.
          </p>
        </div>
      </div>
    </div>
  );
}
