import { motion } from "framer-motion";

export default function Contact() {
  return (
    <div className="pt-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-6"
      >
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-8">Contact</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-medium mb-4">Who is D.EF</h2>
              <address className="text-gray-600 not-italic">
                D.EF - Designs by Ethan Fryer<br />
                B.Arch Virginia Tech AAD<br />
                Architectural Designer<br />
                Honolulu-Tampa-Blacksburg-?
              </address>
              
              <div className="mt-4">
                <a href="tel:+18135050290" className="text-gray-600 hover:text-black">
                  +1 813 505 0290
                </a>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-medium mb-4">What is D.EF</h2>
              <address className="text-gray-600 not-italic">
                D.EF - Designs by Ethan Fryer<br />
                B.Arch Virginia Tech AAD<br />
                Architectural Designer<br />
              </address>
              
              <div className="mt-4">
                <a href="tel:+12123346853" className="text-gray-600 hover:text-black">
                  + More coming soon
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-medium mb-4">General Inquiries</h2>
            <a href="mailto:Epfryer@vt.edu" className="text-gray-600 hover:text-black">
              Epfryer@vt.edu
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
