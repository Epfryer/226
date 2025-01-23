import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold mb-4">BIG</h3>
            <p className="text-gray-600">
              Bjarke Ingels Group<br />
              Architecture & Design
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Contact</h3>
            <address className="text-gray-600 not-italic">
              49 Kløverbladsgade<br />
              DK-2500 Copenhagen<br />
              Denmark
            </address>
          </div>

          <div>
            <h3 className="font-bold mb-4">Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/about">
                <a className="text-gray-600 hover:text-black transition-colors">About</a>
              </Link>
              <Link href="/contact">
                <a className="text-gray-600 hover:text-black transition-colors">Contact</a>
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} BIG. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
