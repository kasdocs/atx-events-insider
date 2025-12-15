import Navbar from '@/app/components/Navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6" style={{color: '#7B2CBF'}}>
            Hey, I'm Kas! 👋
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Your local Austin events insider, helping you discover the best experiences this city has to offer.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Story Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6" style={{color: '#7B2CBF'}}>
            The Story Behind ATX Events Insider
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
            <p>
              I started ATX Events Insider because I kept finding myself at amazing Austin events that hardly anyone knew about. Local businesses would put on incredible experiences – art walks, food truck gatherings, live music nights – but they'd struggle to get the word out beyond their immediate circle.
            </p>
            <p>
              Meanwhile, my friends and followers on TikTok (@kasdocs, 3200+ strong!) would constantly ask me: "What should I do this weekend?" They were tired of the same old tourist spots and wanted authentic Austin experiences.
            </p>
            <p>
              That's when it clicked. I could be the bridge between amazing local events and people looking for something fun to do.
            </p>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div className="mb-16 bg-purple-50 rounded-xl p-8 border border-purple-100">
          <h2 className="text-3xl font-bold mb-6" style={{color: '#7B2CBF'}}>
            What Makes Us Different
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2" style={{color: '#FF006E'}}>
                🎬 Real Stories, Real People
              </h3>
              <p className="text-gray-700">
                I don't just list events – I go to them, meet the hosts, and tell you what actually happens. You get the insider perspective that directories can't provide.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2" style={{color: '#FF006E'}}>
                🎟️ Free Events Focus
              </h3>
              <p className="text-gray-700">
                Austin's best experiences don't always cost money. I spotlight the amazing free events that make this city special, with a focus on locally-owned businesses.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2" style={{color: '#FF006E'}}>
                🤝 Community First
              </h3>
              <p className="text-gray-700">
                Every event I feature gets promoted to my TikTok and Instagram followers. I drive traffic to organizers' social media, helping local businesses grow their audience.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2" style={{color: '#FF006E'}}>
                📸 Behind the Scenes Access
              </h3>
              <p className="text-gray-700">
                Event organizers invite me to VIP experiences and behind-the-scenes moments. I share that insider access with you through photo essays and stories.
              </p>
            </div>
          </div>
        </div>

        {/* My Mission */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6" style={{color: '#7B2CBF'}}>
            My Mission
          </h2>
          <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl p-8 border border-pink-100">
            <p className="text-xl text-gray-800 leading-relaxed">
              To connect Austinites and visitors with authentic local experiences while supporting the small businesses and creatives that make this city vibrant. Every event I feature, every story I tell, helps someone discover something new and helps a local business reach a new audience.
            </p>
          </div>
        </div>

        {/* By the Numbers */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{color: '#7B2CBF'}}>
            By the Numbers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white border-2 border-purple-200 rounded-xl">
              <div className="text-4xl font-bold mb-2" style={{color: '#7B2CBF'}}>
                3,200+
              </div>
              <div className="text-gray-600">TikTok Followers</div>
            </div>
            <div className="text-center p-6 bg-white border-2 border-purple-200 rounded-xl">
              <div className="text-4xl font-bold mb-2" style={{color: '#7B2CBF'}}>
                350+
              </div>
              <div className="text-gray-600">Instagram Followers</div>
            </div>
            <div className="text-center p-6 bg-white border-2 border-purple-200 rounded-xl">
              <div className="text-4xl font-bold mb-2" style={{color: '#7B2CBF'}}>
                100%
              </div>
              <div className="text-gray-600">Local Focus</div>
            </div>
          </div>
        </div>

        {/* For Event Organizers */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6" style={{color: '#7B2CBF'}}>
            For Event Organizers
          </h2>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border border-gray-200">
            <p className="text-lg text-gray-700 mb-6">
              Want your event featured on ATX Events Insider? I love discovering new events and meeting the people behind them!
            </p>
            <div className="space-y-3 mb-6 text-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <span>Submit your event directly through our submission form</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📸</span>
                <span>I offer professional event photography services for featured stories</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📱</span>
                <span>Get promoted to my TikTok and Instagram audience</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <span>I drive traffic directly to your Instagram page</span>
              </div>
            </div>
            <div className="flex gap-4">
              <a 
                href="/submit-event"
                className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                style={{backgroundColor: '#7B2CBF'}}
              >
                Submit Your Event →
              </a>
              <a 
                href="https://instagram.com/kasdocs" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 rounded-lg font-semibold border-2 transition-colors hover:bg-pink-600 hover:text-white hover:border-pink-600"
                style={{borderColor: '#FF006E', color: '#FF006E'}}
              >
                DM on Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Connect Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6" style={{color: '#7B2CBF'}}>
            Let's Connect
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Follow along for daily Austin event recommendations and behind-the-scenes content!
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://tiktok.com/@kasdocs" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg font-semibold border-2 transition-colors hover:bg-purple-600 hover:text-white"
              style={{borderColor: '#7B2CBF', color: '#7B2CBF'}}
            >
              TikTok @kasdocs
            </a>
            <a 
              href="https://instagram.com/kasdocs" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{backgroundColor: '#FF006E'}}
            >
              Instagram @kasdocs
            </a>
          </div>
        </div>

      </div>
      
    </div>
    
  );
}