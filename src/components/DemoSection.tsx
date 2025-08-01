"use client";

export function DemoSection() {
  return (
    <section id="demo" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-gray-900">
              Experience the Power
            </h2>
            <p className="text-xl text-gray-600">
              Try our interactive demo to see how voice assistants can transform user experience on your website.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <span className="text-gray-700">Natural conversation flow</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <span className="text-gray-700">Instant website navigation</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <span className="text-gray-700">Smart knowledge retrieval</span>
              </div>
            </div>
            
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>Try Demo Now</span>
            </button>
          </div>
          
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-auto">
              <div className="bg-gray-900 rounded-t-xl p-4 -m-6 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 flex-1">
                    <p className="text-sm text-gray-700">
                      Hello! I can help you navigate this website. Try saying "Show me the features"
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1a11 11 0 0 0-11 11v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6a7 7 0 0 1 14 0v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6a11 11 0 0 0-11-11zm0 7a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0v-8a3 3 0 0 0-3-3z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Floating voice waves */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-32 h-32 border-2 border-blue-300 rounded-full animate-ping opacity-20"></div>
              <div className="absolute top-2 left-2 w-28 h-28 border-2 border-blue-400 rounded-full animate-ping opacity-30" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute top-4 left-4 w-24 h-24 border-2 border-blue-500 rounded-full animate-ping opacity-40" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
