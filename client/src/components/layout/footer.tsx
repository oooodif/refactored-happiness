import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI LaTeX Generator</h3>
            <p className="text-gray-600 text-sm">
              Generate professional LaTeX documents, academic papers, and presentations with AI assistance.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/document-history" className="text-blue-600 hover:text-blue-800 text-sm">
                  Document History
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-blue-600 hover:text-blue-800 text-sm">
                  My Account
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Document Types</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/template/article" className="text-blue-600 hover:text-blue-800 text-sm">
                  Academic Articles
                </Link>
              </li>
              <li>
                <Link href="/template/presentation" className="text-blue-600 hover:text-blue-800 text-sm">
                  Presentations
                </Link>
              </li>
              <li>
                <Link href="/template/letter" className="text-blue-600 hover:text-blue-800 text-sm">
                  Professional Letters
                </Link>
              </li>
              <li>
                <Link href="/template/report" className="text-blue-600 hover:text-blue-800 text-sm">
                  Technical Reports
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/subscribe" className="text-blue-600 hover:text-blue-800 text-sm">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/refill" className="text-blue-600 hover:text-blue-800 text-sm">
                  Refill Packs
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} AI LaTeX Generator. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link href="/auth" className="text-sm text-gray-600 hover:text-gray-800">
              Sign In / Register
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}