import { Shield, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-white">LLM Security</span>
            </div>
            <p className="text-sm text-gray-400">
              Multi-provider LLM security middleware with built-in input sanitization and output validation.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="/docs" className="text-sm hover:text-blue-400 transition">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/playground" className="text-sm hover:text-blue-400 transition">
                  Playground
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-sm hover:text-blue-400 transition">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/setup" className="text-sm hover:text-blue-400 transition">
                  Get Started
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Providers</h3>
            <ul className="space-y-2">
              <li className="text-sm">kapa.ai</li>
              <li className="text-sm">VectorShift</li>
              <li className="text-sm text-gray-500">Truffle AI (Coming Soon)</li>
              <li className="text-sm text-gray-500">Parea AI (Coming Soon)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                <Github className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © 2025 LLM Security Middleware. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


