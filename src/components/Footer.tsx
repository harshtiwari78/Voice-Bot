export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1a11 11 0 0 0-11 11v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6a7 7 0 0 1 14 0v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6a11 11 0 0 0-11-11zm0 7a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0v-8a3 3 0 0 0-3-3z"/>
                </svg>
              </div>
              <span className="text-xl font-bold">VAPI Voice Bot</span>
            </div>
            <p className="text-gray-400">
              Create intelligent voice assistants for the modern web
            </p>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <div className="space-y-2">
              <a href="#features" className="block text-gray-400 hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="block text-gray-400 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#demo" className="block text-gray-400 hover:text-white transition-colors">
                Demo
              </a>
            </div>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <div className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Documentation
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                API Reference
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Help Center
              </a>
            </div>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <div className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                About
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Blog
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            &copy; 2024 VAPI Voice Bot Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
