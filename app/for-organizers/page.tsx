import OrganizerInquiryForm from '../components/OrganizerInquiryForm';

export default function ForOrganizersPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      {/* Intro */}
      <section className="mb-16">
        <h1 className="text-4xl font-bold mb-4">
          For Event Organizers & Local Businesses
        </h1>
        <p className="text-lg text-gray-600">
          atxdocs exists to help Austinites discover what’s happening around them.
          If you’re hosting an event or running a local business, we offer a few
          ways to help you reach the right audience without feeling like an ad.
        </p>
      </section>

      {/* How it works */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">How it works</h2>
        <ol className="space-y-4 list-decimal list-inside text-gray-700">
          <li>Submit your event or tell us what you’re working on</li>
          <li>We review for fit and follow up with options</li>
          <li>If it makes sense, we help get it in front of the right people</li>
        </ol>
      </section>

      {/* Offerings */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Ways to work together</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Event Submissions</h3>
            <p className="text-gray-600 text-sm">
              Submit your event to be listed on atxdocs. Free submissions are
              always available, with optional featured placement.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Featured Promotion</h3>
            <p className="text-gray-600 text-sm">
              Highlight your event through subtle featured placement on the site
              and optional promotion through atxdocs.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Event Coverage</h3>
            <p className="text-gray-600 text-sm">
              Photo and video coverage that documents what your event actually
              felt like, not staged marketing content.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Brand Content</h3>
            <p className="text-gray-600 text-sm">
              Visual storytelling for local businesses that want authentic
              content for their own channels.
            </p>
          </div>
        </div>
      </section>

      {/* CTA placeholder */}
      <section className="border-t pt-12">
        <h2 className="text-2xl font-semibold mb-4">
          Interested in working together?
        </h2>
        <p className="text-gray-600 mb-6">
          We’ll start with a quick form so we can understand what you’re planning
          and share the organizer guide.
        </p>

        {/* Form goes here in Step 4 */}
        <OrganizerInquiryForm />

      </section>
    </main>
  );
}
