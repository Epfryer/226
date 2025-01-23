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
              <h2 className="text-xl font-medium mb-4">Copenhagen</h2>
              <address className="text-gray-600 not-italic">
                BIG - Bjarke Ingels Group<br />
                49 Kløverbladsgade<br />
                DK-2500 Copenhagen<br />
                Denmark
              </address>
              
              <div className="mt-4">
                <a href="tel:+4572217227" className="text-gray-600 hover:text-black">
                  +45 7221 7227
                </a>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-medium mb-4">New York</h2>
              <address className="text-gray-600 not-italic">
                BIG - Bjarke Ingels Group<br />
                45 Main Street<br />
                New York, NY 11201<br />
                United States
              </address>
              
              <div className="mt-4">
                <a href="tel:+12123346853" className="text-gray-600 hover:text-black">
                  +1 212 334 6853
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-medium mb-4">General Inquiries</h2>
            <a href="mailto:info@big.dk" className="text-gray-600 hover:text-black">
              info@big.dk
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
