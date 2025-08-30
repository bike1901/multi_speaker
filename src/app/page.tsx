import AuthButton from '@/components/AuthButton'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                🎙️ MultiSpeaker
              </h1>
            </div>
            <AuthButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Multi-Speaker Recording
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Record high-quality conversations with multiple speakers using LiveKit and Supabase.
            Each participant gets their own audio track for perfect post-processing.
          </p>
          
          <div className="mt-10 flex justify-center">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Individual Tracks</h3>
                <p className="text-gray-600">Each speaker gets their own high-quality audio track for perfect separation and editing.</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Real-time</h3>
                <p className="text-gray-600">Low-latency audio streaming with LiveKit&apos;s optimized infrastructure.</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-3xl mb-4">🔒</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Secure</h3>
                <p className="text-gray-600">Row-level security with Supabase ensures your recordings stay private.</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started</h2>
              <p className="text-gray-600 mb-6">
                Sign in with GitHub or Google to test the authentication system. Recording features are coming soon!
              </p>
              <AuthButton />
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">🚧 Development Roadmap</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✅ Authentication & Database</li>
                  <li>✅ Storage & File Management</li>
                  <li>🔄 LiveKit Server Setup (GCP)</li>
                  <li>⏳ Room Management UI</li>
                  <li>⏳ Multi-Speaker Recording</li>
                  <li>⏳ Audio Track Export</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Test Pages Navigation */}
          <div className="mt-10">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🧪 Test Pages</h2>
              <p className="text-gray-600 mb-6">
                Test the various components of the system while we build the full recording functionality.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="/test-db"
                  className="block p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center mb-3">
                    <div className="text-2xl mr-3">🗄️</div>
                    <h3 className="text-lg font-semibold text-blue-900">Database Test</h3>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Test authentication, create rooms, and verify database operations with RLS policies.
                  </p>
                </a>

                <a
                  href="/test-storage"
                  className="block p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center mb-3">
                    <div className="text-2xl mr-3">📁</div>
                    <h3 className="text-lg font-semibold text-green-900">Storage Test</h3>
                  </div>
                  <p className="text-green-700 text-sm">
                    Test file uploads, downloads, and S3-compatible storage with signed URLs.
                  </p>
                </a>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> You need to be signed in to access the test pages. 
                  Create rooms and test functionality before we add LiveKit integration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}