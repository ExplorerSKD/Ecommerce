import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  title: string;
  image: string;
  itemCount: string;
  slug?: string;
  index: number;
}

export function CategoryCard({ title, image, itemCount, slug, index }: CategoryCardProps) {
  const categorySlug = slug || title.toLowerCase();

  return (
    <Link to={`/shop?category=${categorySlug}`}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -10 }}
        className="group relative overflow-hidden rounded-2xl cursor-pointer"
      >
        <div className="aspect-[3/4] relative">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 text-white">
            <motion.div
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              className="space-y-1 sm:space-y-2"
            >
              <h3 className="text-lg sm:text-2xl font-medium">{title}</h3>
              <p className="text-xs sm:text-base text-white/80">{itemCount}</p>
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-base text-white group-hover:text-purple-300 transition-colors">
                <span>Shop Now</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </div>

          {/* Hover Effect Border */}
          <motion.div
            className="absolute inset-0 border-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
          />
        </div>
      </motion.div>
    </Link>
  );
}
