import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Grid, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collectionsApi, Collection } from '../services/api';

export function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setLoading(true);
        const result = await collectionsApi.getAll();
        if (result.success && result.data) {
            setCollections(result.data);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4"
                    >
                        <Grid className="w-8 h-8 text-purple-600" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-bold text-gray-900 mb-4"
                    >
                        Our Collections
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-600 max-w-2xl mx-auto"
                    >
                        Explore our curated collections of premium products, handpicked for you.
                    </motion.p>
                </div>

                {/* Collections Grid */}
                {collections.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-xl p-12 text-center text-gray-500"
                    >
                        No collections available at the moment.
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {collections.map((collection, index) => (
                            <motion.div
                                key={collection.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link
                                    to={`/collections/${collection.slug}`}
                                    className="block bg-white rounded-2xl shadow-sm overflow-hidden group"
                                >
                                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                        {collection.image && (
                                            <img
                                                src={collection.image}
                                                alt={collection.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                            <h3 className="text-2xl font-bold mb-1">{collection.name}</h3>
                                            {collection.products_count !== undefined && (
                                                <p className="text-sm text-gray-200">
                                                    {collection.products_count} products
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {collection.description && (
                                        <div className="p-6">
                                            <p className="text-gray-600 line-clamp-2">{collection.description}</p>
                                        </div>
                                    )}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
