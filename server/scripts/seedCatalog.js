import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Category, { slugify } from '../models/category.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';

dotenv.config();

const seedCatalog = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ MONGODB_URI is missing from environment variables.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to MongoDB for catalog seeding...');
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB.');

    // Find superadmin user for createdBy reference
    let adminUser = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
    if (!adminUser) {
      adminUser = await User.findOne({});
    }

    const adminId = adminUser ? adminUser._id : null;

    // Initial Categories Data
    const categoriesData = [
      {
        name: 'Bags',
        description: 'Handcrafted luxury leather totes, shoulder bags, and bespoke travel luggage.',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Shoes',
        description: 'Tailored leather dress shoes, luxury loafers, and formal footwear.',
        image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Sneakers',
        description: 'Contemporary high-fashion casual sneakers and urban designer streetwear footwear.',
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Kitchen Accessories',
        description: 'Opulent gold-trimmed cookware, artisanal dining sets, and luxury homeware accessories.',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
      },
    ];

    console.log('📦 Seeding Categories...');
    const categoryMap = {};

    for (const catData of categoriesData) {
      const slug = slugify(catData.name);
      let cat = await Category.findOne({ slug });
      if (!cat) {
        cat = await Category.create({
          name: catData.name,
          slug,
          description: catData.description,
          image: catData.image,
          status: 'active',
          createdBy: adminId,
        });
        console.log(`   + Created Category: ${cat.name} (${cat.slug})`);
      } else {
        console.log(`   • Existing Category: ${cat.name}`);
      }
      categoryMap[slug] = cat._id;
    }

    // Sample Products Data
    const productsData = [
      {
        name: 'Premium Leather Handbag',
        sku: 'AYS-BAG-0001',
        categorySlug: 'bags',
        price: 180000,
        discount: 10,
        quantity: 15,
        featured: true,
        bestSeller: true,
        shortDescription: 'Handcrafted full-grain Italian leather bag with gold accent hardware.',
        description: 'An emblem of prestige and timeless sophistication. The Premium Leather Handbag features hand-stitched seams, soft suede interior lining, multiple security pockets, and a signature gold emblem badge.',
        images: [
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
        ],
      },
      {
        name: 'Ladies Fashion Tote',
        sku: 'AYS-BAG-0002',
        categorySlug: 'bags',
        price: 145000,
        discount: 5,
        quantity: 8,
        featured: false,
        bestSeller: true,
        shortDescription: 'Spacious everyday luxury tote crafted with structured pebbled leather.',
        description: 'Designed for the modern professional woman. Includes dual reinforced top handles, padded tablet divider, and gold protective feet.',
        images: [
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
        ],
      },
      {
        name: 'Classic Leather Shoe',
        sku: 'AYS-SHOE-0001',
        categorySlug: 'shoes',
        price: 160000,
        discount: 0,
        quantity: 12,
        featured: true,
        bestSeller: false,
        shortDescription: 'Hand-finished Goodyear welted Oxford shoe in burnished chestnut leather.',
        description: 'Crafted for formal distinction and gala events. Made from single-cut calfskin leather with a cushioned leather sole for all-day elegance.',
        images: [
          'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
        ],
      },
      {
        name: 'Signature Velvet Loafer',
        sku: 'AYS-SHOE-0002',
        categorySlug: 'shoes',
        price: 210000,
        discount: 15,
        quantity: 4, // Low stock sample
        featured: true,
        bestSeller: true,
        shortDescription: 'Bespoke velvet tuxedo loafer featuring hand-embroidered gold crest.',
        description: 'The pinnacle of luxury evening footwear. Tailored deep royal navy velvet with gold thread embroidery and stacked leather heel.',
        images: [
          'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80',
        ],
      },
      {
        name: 'Urban Casual Sneakers',
        sku: 'AYS-SNK-0001',
        categorySlug: 'sneakers',
        price: 125000,
        discount: 0,
        quantity: 20,
        featured: false,
        bestSeller: true,
        shortDescription: 'Sleek monochrome low-top sneakers in soft Nappa leather.',
        description: 'Effortless luxury streetwear. Crafted with ultra-lightweight rubber outsoles and breathable perforated toe box detail.',
        images: [
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80',
        ],
      },
      {
        name: 'Men Classic High Sneakers',
        sku: 'AYS-SNK-0002',
        categorySlug: 'sneakers',
        price: 140000,
        discount: 10,
        quantity: 0, // Out of stock sample
        featured: true,
        bestSeller: false,
        shortDescription: 'High-top luxury trainer styled with gold eyelet accents.',
        description: 'A bold statement in street luxury. Premium suede paneling, gold eyelet hardware, and padded ankle collar.',
        images: [
          'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80',
        ],
      },
      {
        name: 'Modern Kitchen Storage Set',
        sku: 'AYS-KTC-0001',
        categorySlug: 'kitchen-accessories',
        price: 95000,
        discount: 5,
        quantity: 10,
        featured: true,
        bestSeller: true,
        shortDescription: 'Artisanal ceramic container set with airtight brushed gold lids.',
        description: 'Elevate your culinary space. Set of 4 handcrafted matte-finished porcelain canisters designed for elegance and freshness.',
        images: [
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
        ],
      },
      {
        name: 'Gold Trim Cutlery Suite',
        sku: 'AYS-KTC-0002',
        categorySlug: 'kitchen-accessories',
        price: 110000,
        discount: 0,
        quantity: 15,
        featured: false,
        bestSeller: false,
        shortDescription: '24-piece mirror-finish stainless steel dining set with 24K gold plating.',
        description: 'Complete dining luxury for 6 guests. Heavyweight stainless steel with durable 24K electroplated gold handles in a luxury wooden gift case.',
        images: [
          'https://images.unsplash.com/photo-1615865417236-d67f572a7467?auto=format&fit=crop&w=800&q=80',
        ],
      },
    ];

    console.log('🛍️ Seeding Products...');
    for (const prodData of productsData) {
      const categoryId = categoryMap[prodData.categorySlug];
      if (!categoryId) continue;

      const slug = slugify(prodData.name);
      let prod = await Product.findOne({ sku: prodData.sku });

      const finalPrice = Math.max(0, Math.round(prodData.price * (1 - (prodData.discount || 0) / 100)));

      if (!prod) {
        prod = await Product.create({
          name: prodData.name,
          slug,
          sku: prodData.sku,
          price: prodData.price,
          discount: prodData.discount,
          finalPrice,
          description: prodData.description,
          shortDescription: prodData.shortDescription,
          images: prodData.images,
          quantity: prodData.quantity,
          category: categoryId,
          featured: prodData.featured,
          bestSeller: prodData.bestSeller,
          status: 'active',
          createdBy: adminId,
        });
        console.log(`   + Created Product: ${prod.name} [${prod.sku}] (₦${prod.finalPrice.toLocaleString()})`);
      } else {
        console.log(`   • Existing Product: ${prod.name} [${prod.sku}]`);
      }
    }

    console.log('--------------------------------------------------');
    console.log('🎉 Catalog seeding finished successfully!');
    console.log('--------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding catalog:', error.message);
    process.exit(1);
  }
};

seedCatalog();
