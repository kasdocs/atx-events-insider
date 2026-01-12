export const dynamic = 'force-dynamic';

import Navbar from '@/app/components/Navbar';
import OrganizerInquiryForm from '../components/OrganizerInquiryForm';

export default function ForOrganizersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="bg-white">
        {/* Hero */}
        <section className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-14 sm:py-18">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-gray-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-purple-600" />
                  Organizer promotion + community-first reach
                </div>

                <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                  For Event Organizers & Local Businesses
                </h1>

                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  ATX Events Insider (atxdocs) helps Austinites find what to do this weekend.
                  If you’re hosting an event or building something local, we can help you
                  reach the right people without feeling like an ad.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a
                    href="#inquiry"
                    className="inline-flex justify-center rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
                  >
                    Get promotion options
                  </a>

                  <a
                    href="/submit-event"
                    className="inline-flex justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Submit an event for free
                  </a>
                </div>

                <p className="mt-3 text-sm text-gray-500">
                  Free submissions stay free. Featured placement is optional.
                </p>
              </div>

              {/* Right column: quick stats / proof placeholders */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border bg-gray-50 p-6">
                  <h2 className="text-sm font-semibold text-gray-900">
                    What you’re buying is attention, not ads
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    When you’re ready, we’ll recommend the best placement based on your date,
                    neighborhood, and vibe.
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white border p-4">
                      <div className="text-2xl font-extrabold text-gray-900">—</div>
                      <div className="mt-1 text-xs text-gray-600">Weekly visitors</div>
                    </div>
                    <div className="rounded-xl bg-white border p-4">
                      <div className="text-2xl font-extrabold text-gray-900">—</div>
                      <div className="mt-1 text-xs text-gray-600">Email reach</div>
                    </div>
                    <div className="rounded-xl bg-white border p-4">
                      <div className="text-2xl font-extrabold text-gray-900">—</div>
                      <div className="mt-1 text-xs text-gray-600">Avg. clicks</div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border bg-white p-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">Pro tip:</span> If your event
                      is time-sensitive (this week), tell us the date upfront and we’ll prioritize
                      the fastest option.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why work with us */}
        <section className="py-14">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Built for locals who actually go out
              </h2>
              <p className="mt-3 text-gray-600 leading-relaxed">
                This isn’t a generic calendar. We focus on what people want to do right now:
                weekend plans, friend-friendly events, date night ideas, and things worth leaving
                the house for.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border p-6">
                <h3 className="font-semibold text-gray-900">Context, not clutter</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Your listing shows the details people care about (when, where, vibe),
                  without spammy banner ads.
                </p>
              </div>

              <div className="rounded-2xl border p-6">
                <h3 className="font-semibold text-gray-900">Curated fit</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  We review submissions to keep quality high. Better experience for readers,
                  better results for organizers.
                </p>
              </div>

              <div className="rounded-2xl border p-6">
                <h3 className="font-semibold text-gray-900">Promotion that feels native</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Featured placement is subtle, clean, and designed to blend in with real content.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Offerings */}
        <section className="py-14 bg-gray-50 border-y">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ways to work together</h2>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Choose what makes sense for your budget and timeline. We’ll recommend the right option
                once we see your event details.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900">Event Submissions</h3>
                  <span className="rounded-full bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 text-xs font-semibold">
                    Free option
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Submit your event to be listed. Free submissions are always available,
                  with optional featured placement.
                </p>
                <div className="mt-4">
                  <a
                    href="/submit-event"
                    className="text-sm font-semibold text-purple-700 hover:text-purple-800"
                  >
                    Submit for free →
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900">Featured Promotion</h3>
                  <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 text-xs font-semibold">
                    Paid
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Subtle featured placement on the site with optional promotion through atxdocs channels.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-900" />
                    Ranked placement with scheduling (great for this-week events)
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-900" />
                    Looks native to the browsing experience
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border bg-white p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900">Event Coverage</h3>
                  <span className="rounded-full bg-gray-100 text-gray-700 border px-2.5 py-1 text-xs font-semibold">
                    Photo / video
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Photo and video coverage that documents what your event actually felt like,
                  not staged marketing content.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900">Brand Content</h3>
                  <span className="rounded-full bg-gray-100 text-gray-700 border px-2.5 py-1 text-xs font-semibold">
                    Ongoing
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Visual storytelling for local businesses that want authentic content for their own channels.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border bg-white p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pricing</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    We’ll share simple tiers once we see your date, goals, and timeline.
                  </p>
                </div>
                <a
                  href="#inquiry"
                  className="inline-flex justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  Request the organizer guide
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Fast, simple, and not pushy. If it’s a fit, we’ll suggest the best option.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border p-6">
                <div className="text-sm font-semibold text-purple-700">Step 1</div>
                <h3 className="mt-2 font-semibold text-gray-900">Tell us what you’re promoting</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Share event details, dates, neighborhood, and what “success” looks like for you.
                </p>
              </div>

              <div className="rounded-2xl border p-6">
                <div className="text-sm font-semibold text-purple-700">Step 2</div>
                <h3 className="mt-2 font-semibold text-gray-900">We review and recommend</h3>
                <p className="mt-2 text-sm text-gray-600">
                  We’ll follow up with the organizer guide + suggested placement options.
                </p>
              </div>

              <div className="rounded-2xl border p-6">
                <div className="text-sm font-semibold text-purple-700">Step 3</div>
                <h3 className="mt-2 font-semibold text-gray-900">Launch promotion</h3>
                <p className="mt-2 text-sm text-gray-600">
                  If you choose featured placement, we schedule it and make sure it runs on time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 bg-gray-50 border-y">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">FAQ</h2>
              <p className="mt-3 text-gray-600">Quick answers so you know what to expect.</p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6">
                <h3 className="font-semibold text-gray-900">Is event submission always free?</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Yes. You can submit for free anytime. Paid options are only for optional featured placement
                  or promotion add-ons.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-6">
                <h3 className="font-semibold text-gray-900">How fast can a featured promo go live?</h3>
                <p className="mt-2 text-sm text-gray-600">
                  If your event is this week, mention that in the form. We’ll prioritize quick turn options
                  based on available slots.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-6">
                <h3 className="font-semibold text-gray-900">Do you guarantee attendance?</h3>
                <p className="mt-2 text-sm text-gray-600">
                  No. We’re a discovery platform. We focus on high-intent visibility (people actively browsing
                  for plans), not inflated impressions.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-6">
                <h3 className="font-semibold text-gray-900">What kinds of events do you feature?</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Things that feel relevant to Austinites and match the site vibe. If it’s a fit, we’ll suggest
                  the best placement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Form CTA */}
        <section id="inquiry" className="py-14">
          <div className="max-w-6xl mx-auto px-4">
            <div className="rounded-3xl border bg-white p-8 sm:p-10">
              <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
                <div className="lg:col-span-5">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Interested in working together?
                  </h2>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    Start with a quick form so we can understand what you’re planning and share the organizer
                    guide. If it’s a fit, we’ll follow up with promotion options.
                  </p>

                  <div className="mt-6 rounded-2xl bg-gray-50 border p-5">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">What to include:</span> event date,
                      neighborhood, ticket link (if any), and whether you want featured placement.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <OrganizerInquiryForm />
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              Note: If you only want a standard listing, you can always{' '}
              <a
                href="/submit-event"
                className="font-semibold text-purple-700 hover:text-purple-800"
              >
                submit for free
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
