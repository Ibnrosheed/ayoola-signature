/**
 * seedShipping.js
 * One-time script to seed default Nigeria shipping zones and methods.
 * Run from server directory: node scripts/seedShipping.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import ShippingZone from '../models/shippingZone.model.js';
import ShippingMethod from '../models/shippingMethod.model.js';
import ShippingSetting from '../models/shippingSetting.model.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}

const zones = [
  {
    name: 'Lagos',
    description: 'Lagos State delivery',
    states: ['Lagos'],
    cities: ['Lagos Island', 'Victoria Island', 'Lekki', 'Ikeja', 'Surulere', 'Yaba', 'Ikoyi', 'Ajah', 'Festac', 'Alaba'],
  },
  {
    name: 'Abuja',
    description: 'FCT Abuja delivery',
    states: ['FCT', 'Abuja'],
    cities: ['Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa'],
  },
  {
    name: 'South West',
    description: 'Ogun, Oyo, Osun, Ondo, Ekiti, Kwara',
    states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti', 'Kwara'],
    cities: [],
  },
  {
    name: 'South East',
    description: 'Enugu, Anambra, Imo, Abia, Ebonyi',
    states: ['Enugu', 'Anambra', 'Imo', 'Abia', 'Ebonyi'],
    cities: [],
  },
  {
    name: 'South South',
    description: 'Rivers, Delta, Cross River, Akwa Ibom, Bayelsa, Edo',
    states: ['Rivers', 'Delta', 'Cross River', 'Akwa Ibom', 'Bayelsa', 'Edo'],
    cities: ['Port Harcourt', 'Benin City', 'Warri', 'Calabar', 'Uyo'],
  },
  {
    name: 'North',
    description: 'All northern states',
    states: [
      'Kano', 'Kaduna', 'Katsina', 'Sokoto', 'Zamfara', 'Kebbi',
      'Jigawa', 'Bauchi', 'Gombe', 'Adamawa', 'Taraba', 'Borno',
      'Yobe', 'Niger', 'Nassarawa', 'Plateau', 'Benue', 'Kogi',
    ],
    cities: [],
  },
  {
    name: 'Other',
    description: 'Nationwide fallback for unmatched addresses',
    states: [],
    cities: [],
  },
];

const methodTemplates = {
  'Lagos': [
    ['Standard Delivery', 'Delivered within Lagos in 1-2 business days', 'fixed', 2500, '1-2 business days'],
    ['Express Delivery', 'Same-day or next-day delivery within Lagos', 'fixed', 5000, 'Same day / Next day'],
  ],
  'Abuja': [
    ['Standard Delivery', 'Delivered in Abuja within 2-3 business days', 'fixed', 3000, '2-3 business days'],
    ['Express Delivery', 'Next-day delivery within Abuja', 'fixed', 6000, '1 business day'],
  ],
  'South West': [
    ['Standard Delivery', 'Delivery to South West states in 3-5 business days', 'fixed', 3500, '3-5 business days'],
  ],
  'South East': [
    ['Standard Delivery', 'Delivery to South East states in 4-6 business days', 'fixed', 4000, '4-6 business days'],
  ],
  'South South': [
    ['Standard Delivery', 'Delivery to South South states in 4-6 business days', 'fixed', 4000, '4-6 business days'],
  ],
  'North': [
    ['Standard Delivery', 'Delivery to Northern states in 5-7 business days', 'fixed', 5000, '5-7 business days'],
  ],
  'Other': [
    ['Nationwide Standard', 'Nationwide delivery for all other locations', 'fixed', 6000, '5-10 business days'],
  ],
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const zoneData of zones) {
    const existing = await ShippingZone.findOne({ name: zoneData.name });
    if (existing) {
      console.log('Zone already exists: ' + zoneData.name);
      skipped++;

      const templates = methodTemplates[zoneData.name] || [];
      for (const [name, description, feeType, baseFee, deliveryEstimate] of templates) {
        const existingMethod = await ShippingMethod.findOne({ name, zone: existing._id });
        if (!existingMethod) {
          await ShippingMethod.create({ name, description, zone: existing._id, feeType, baseFee, deliveryEstimate });
          console.log('  Method added: ' + name + ' => ' + zoneData.name);
        }
      }
      continue;
    }

    const zone = await ShippingZone.create(zoneData);
    console.log('Zone created: ' + zone.name);
    created++;

    const templates = methodTemplates[zoneData.name] || [];
    for (const [name, description, feeType, baseFee, deliveryEstimate] of templates) {
      await ShippingMethod.create({ name, description, zone: zone._id, feeType, baseFee, deliveryEstimate });
      console.log('  Method: ' + name + ' (N' + baseFee + ')');
    }
  }

  const settings = await ShippingSetting.findOne({ key: 'global' });
  if (!settings) {
    await ShippingSetting.create({
      key: 'global',
      freeShippingEnabled: true,
      freeShippingThreshold: 100000,
    });
    console.log('Global shipping settings created');
  } else {
    console.log('Global shipping settings already exist');
  }

  console.log('Done! Zones created: ' + created + ', skipped: ' + skipped);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error: ' + err.message);
  process.exit(1);
});
