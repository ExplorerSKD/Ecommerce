import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Mail, CheckCircle } from 'lucide-react';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    // Simulate subscription
    setSubscribed(true);
    setEmail('');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 py-16">
      {/* Animated Background Pattern */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full"
          >
            {subscribed ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : (
              <Mail className="w-8 h-8 text-white" />
            )}
          </motion.div>

          {subscribed ? (
            <>
              <h2 className="text-4xl text-white">
                Thanks for Subscribing!
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                You'll receive our latest updates and exclusive offers soon.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSubscribed(false)}
                className="bg-white/20 text-white px-6 py-3 rounded-full hover:bg-white/30 transition-colors"
              >
                Subscribe Another Email
              </motion.button>
            </>
          ) : (
            <>
              <h2 className="text-4xl text-white">
                Subscribe to Our Newsletter
              </h2>

              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Get the latest updates on new products and exclusive offers. Join our community today!
              </p>

              {/* Email Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mt-8"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-6 py-4 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="bg-white text-purple-600 px-8 py-4 rounded-full flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
                >
                  <span>Subscribe</span>
                  <Send className="w-5 h-5" />
                </motion.button>
              </motion.form>

              {error && (
                <p className="text-white/90 text-sm bg-red-500/20 px-4 py-2 rounded-full inline-block">
                  {error}
                </p>
              )}

              <p className="text-white/70 text-sm">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
