import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import ShippingZone from '../models/shippingZone.model.js';
import ShippingMethod from '../models/shippingMethod.model.js';
import ShippingSetting from '../models/shippingSetting.model.js';

const router = express.Router();

const ZONES = [
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

const METHOD_TEMPLATES = {
  'Lagos': [
    ['Standard Delivery', '1-2 business days delivery within Lagos', 'fixed', 2500, '1-2 business days'],
    ['Express Delivery', 'Same-day or next-day delivery within Lagos', 'fixed', 5000, 'Same day / Next day'],
  ],
  'Abuja': [
    ['Standard Delivery', '2-3 business days delivery within Abuja', 'fixed', 3000, '2-3 business days'],
    ['Express Delivery', 'Next-day delivery within Abuja', 'fixed', 6000, '1 business day'],
  ],
  'South West': [
    ['Standard Delivery', 'Delivery to South West in 3-5 business days', 'fixed', 3500, '3-5 business days'],
  ],
  'South East': [
    ['Standard Delivery', 'Delivery to South East in 4-6 business days', 'fixed', 4000, '4-6 business days'],
  ],
  'South South': [
    ['Standard Delivery', 'Delivery to South South in 4-6 business days', 'fixed', 4000, '4-6 business days'],
  ],
  'North': [
    ['Standard Delivery', 'Delivery to Northern states in 5-7 business days', 'fixed', 5000, '5-7 business days'],
  ],
  'Other': [
    ['Nationwide Standard', 'Nationwide delivery for all other locations', 'fixed', 6000, '5-10 business days'],
  ],
};

/**
 * @desc   Seed default Nigeria shipping zones + methods (idempotent)
 * @route  POST /api/admin/seed/shipping
 * @access Superadmin only
 */
router.post('/shipping', protect, authorize('superadmin'), async (req, res, next) => {
  try {
    const results = [];

    for (const zoneData of ZONES) {
      let zone = await ShippingZone.findOne({ name: zoneData.name });
      if (!zone) {
        zone = await ShippingZone.create(zoneData);
        results.push({ zone: zone.name, status: 'created' });
      } else {
        results.push({ zone: zone.name, status: 'exists' });
      }

      const templates = METHOD_TEMPLATES[zoneData.name] || [];
      for (const [name, description, feeType, baseFee, deliveryEstimate] of templates) {
        const existing = await ShippingMethod.findOne({ name, zone: zone._id });
        if (!existing) {
          await ShippingMethod.create({ name, description, zone: zone._id, feeType, baseFee, deliveryEstimate });
          results.push({ method: name, zone: zone.name, status: 'created' });
        } else {
          results.push({ method: name, zone: zone.name, status: 'exists' });
        }
      }
    }

    // Ensure global shipping settings
    let settings = await ShippingSetting.findOne({ key: 'global' });
    if (!settings) {
      settings = await ShippingSetting.create({
        key: 'global',
        freeShippingEnabled: true,
        freeShippingThreshold: 100000,
      });
      results.push({ settings: 'global', status: 'created' });
    } else {
      results.push({ settings: 'global', status: 'exists' });
    }

    res.status(200).json({ success: true, message: 'Shipping seed complete', data: results });
  } catch (error) {
    next(error);
  }
});

export default router;
