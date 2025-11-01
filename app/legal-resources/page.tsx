import Link from "next/link";
import { Scale, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LegalResourcesPage() {
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
            <Scale className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Legal Resources</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Know Your Rights</h2>
          <p className="text-lg text-muted-foreground">
            Workers in the United States have legally protected rights to organize and coordinate.
            Understanding these rights empowers you to take action safely and effectively.
          </p>
        </div>

        {/* Section 7 - NLRA */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Section 7 of the NLRA</CardTitle>
            <CardDescription>
              The Foundation of Workers' Rights to Organize
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-3">What Section 7 Says:</h3>
              <blockquote className="border-l-4 border-blue-600 pl-4 italic">
                "Employees shall have the right to self-organization, to form, join, or assist labor
                organizations, to bargain collectively through representatives of their own choosing,
                and to engage in other concerted activities for the purpose of collective bargaining
                or other mutual aid or protection..."
              </blockquote>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-lg">What This Means for You:</h3>
              <ul className="space-y-2 ml-6 list-disc">
                <li>You can discuss wages, benefits, and working conditions with coworkers</li>
                <li>You can organize to improve your workplace—even without a union</li>
                <li>You can coordinate collective action with coworkers</li>
                <li>Your employer cannot retaliate against you for organizing</li>
                <li>These rights apply to most private-sector workers</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="font-semibold mb-2">Important Note:</p>
              <p className="text-sm">
                Section 7 protects "concerted activity" - meaning you're acting with or on behalf of
                other workers. Individual complaints may not be protected, but organizing with coworkers is.
              </p>
            </div>

            <a
              href="https://www.nlrb.gov/about-nlrb/rights-we-protect/the-law/employees/concerted-activity"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:underline"
            >
              Read More on NLRB Website
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </CardContent>
        </Card>

        {/* Protected Activities */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Protected Activities</CardTitle>
              <CardDescription>
                These activities are legally protected under Section 7
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Discussing pay and benefits with coworkers</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Organizing a petition about working conditions</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Meeting with coworkers to discuss workplace issues</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Coordinating collective demands to management</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Refusing to work under unsafe conditions (as a group)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Supporting coworkers in workplace disputes</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Prohibited Employer Actions</CardTitle>
              <CardDescription>
                Employers cannot legally do these things
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Fire or discipline you for organizing</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Threaten workers who discuss organizing</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Interrogate workers about union activity</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Spy on or surveil organizing meetings</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Promise benefits to discourage organizing</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Create policies that ban workplace discussions</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Who is Covered */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Who is Covered by the NLRA?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">Covered Workers:</h3>
              <ul className="ml-6 list-disc space-y-1">
                <li>Most private-sector employees</li>
                <li>Full-time and part-time workers</li>
                <li>Workers in "right to work" states</li>
                <li>Non-unionized workers</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">Exceptions (Not Covered):</h3>
              <ul className="ml-6 list-disc space-y-1">
                <li>Federal, state, and local government employees</li>
                <li>Agricultural workers</li>
                <li>Independent contractors (though classification may be disputed)</li>
                <li>Supervisors and managers</li>
                <li>Railroad and airline workers (covered under separate laws)</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Even if you're not covered by the NLRA, you may have organizing rights under state law.
              Check your local labor laws.
            </p>
          </CardContent>
        </Card>

        {/* Filing a Complaint */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>If Your Rights Are Violated</CardTitle>
            <CardDescription>
              Steps to take if your employer retaliates against organizing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 ml-6 list-decimal">
              <li>
                <strong>Document Everything:</strong> Keep records of incidents, emails, and witnesses
              </li>
              <li>
                <strong>File with the NLRB:</strong> You have 6 months to file an unfair labor practice charge
              </li>
              <li>
                <strong>Contact a Labor Attorney:</strong> Get legal advice if you've been retaliated against
              </li>
              <li>
                <strong>Reach Out to Worker Centers:</strong> Local organizations can provide support
              </li>
            </ol>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="font-semibold mb-2">File with the NLRB:</p>
              <a
                href="https://www.nlrb.gov/about-nlrb/what-we-do/investigate-charges"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center"
              >
                NLRB - File a Charge
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">National Labor Relations Board (NLRB)</h3>
                <a
                  href="https://www.nlrb.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  www.nlrb.gov
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Worker Rights Hotline</h3>
                <p className="text-muted-foreground">1-844-762-6572 (NLRB)</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Labor Education & Research Network</h3>
                <a
                  href="https://www.lawcha.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  Labor and Working-Class History Association
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-muted-foreground">
          <p className="font-semibold mb-2">Legal Disclaimer:</p>
          <p>
            This information is provided for educational purposes only and does not constitute legal advice.
            Labor law is complex and varies by jurisdiction. For specific legal questions, consult a qualified
            labor attorney in your area.
          </p>
        </div>
      </div>
    </div>
  );
}
