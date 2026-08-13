import ShippingZone from '../models/shippingZone.model.js';
import ShippingMethod from '../models/shippingMethod.model.js';
import PickupLocation from '../models/pickupLocation.model.js';
import ShippingSetting from '../models/shippingSetting.model.js';
import {
  resolveZoneForAddress,
  getAvailableMethodsForZone,
  getShippingSettings,
} from '../services/shipping.service.js';

// --- PUBLIC / CUSTOMER ------------------------------------------------------

/**
 * GET /api/shipping/zones
 * Returns all active shipping zones (public)
 */
export const getPublicZones = async (req, res, next) => {
  try {
    const zones = await ShippingZone.find({ isActive: true }).select('name description states').lean();
    res.status(200).json({ success: true, data: { zones } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/shipping/methods/available
 * Body: { state, city, country, cartSubtotal }
 * Backend determines zone and returns available shipping methods with fees.
 * Never trusts frontend-supplied zoneId or fee.
 */
export const getAvailableShippingMethods = async (req, res, next) => {
  try {
    const { state, city, country = 'Nigeria', cartSubtotal = 0 } = req.body;

    if (!state) {
      return res.status(400).json({ success: false, message: 'Delivery state is required to determine shipping options' });
    }

    const zone = await resolveZoneForAddress({ state, city, country });
    if (!zone) {
      return res.status(200).json({
        success: true,
        data: { methods: [], zone: null, message: 'No shipping options available for this location' },
      });
    }

    const methods = await getAvailableMethodsForZone(zone, Number(cartSubtotal));
    const settings = await getShippingSettings();

    res.status(200).json({
      success: true,
      data: {
        zone: { id: zone._id, name: zone.name },
        methods,
        freeShippingEnabled: settings.freeShippingEnabled,
        freeShippingThreshold: settings.freeShippingThreshold,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/shipping/pickup-locations
 * Returns all active pickup locations (public)
 */
export const getPublicPickupLocations = async (req, res, next) => {
  try {
    const locations = await PickupLocation.find({ isActive: true }).lean();
    res.status(200).json({ success: true, data: { locations } });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN: SHIPPING ZONES ---------------------------------------------------

export const adminGetZones = async (req, res, next) => {
  try {
    const zones = await ShippingZone.find({}).lean();
    const methodCounts = await Promise.all(
      zones.map((z) => ShippingMethod.countDocuments({ zone: z._id, isActive: true }))
    );
    const result = zones.map((z, i) => ({ ...z, activeMethodCount: methodCounts[i] }));
    res.status(200).json({ success: true, data: { zones: result } });
  } catch (error) {
    next(error);
  }
};

export const adminCreateZone = async (req, res, next) => {
  try {
    const { name, description, states, cities, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Zone name is required' });
    }
    const existing = await ShippingZone.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A zone with this name already exists' });
    }
    const zone = await ShippingZone.create({
      name: name.trim(),
      description: description?.trim() || '',
      states: Array.isArray(states) ? states : [],
      cities: Array.isArray(cities) ? cities : [],
      isActive: isActive !== false,
    });
    res.status(201).json({ success: true, message: 'Shipping zone created', data: { zone } });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateZone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, states, cities, isActive } = req.body;
    const zone = await ShippingZone.findById(id);
    if (!zone) return res.status(404).json({ success: false, message: 'Shipping zone not found' });
    if (name) zone.name = name.trim();
    if (description !== undefined) zone.description = description.trim();
    if (Array.isArray(states)) zone.states = states;
    if (Array.isArray(cities)) zone.cities = cities;
    if (isActive !== undefined) zone.isActive = isActive;
    await zone.save();
    res.status(200).json({ success: true, message: 'Shipping zone updated', data: { zone } });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteZone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const methodCount = await ShippingMethod.countDocuments({ zone: id });
    if (methodCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete zone with ${methodCount} shipping method(s). Reassign or delete the methods first.`,
      });
    }
    await ShippingZone.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Shipping zone deleted' });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN: SHIPPING METHODS -------------------------------------------------

export const adminGetMethods = async (req, res, next) => {
  try {
    const methods = await ShippingMethod.find({}).populate('zone', 'name').lean();
    res.status(200).json({ success: true, data: { methods } });
  } catch (error) {
    next(error);
  }
};

export const adminCreateMethod = async (req, res, next) => {
  try {
    const { name, description, zone, feeType, baseFee, deliveryEstimate, minOrderAmount, isPickup, isActive } = req.body;
    if (!name || !zone) {
      return res.status(400).json({ success: false, message: 'Name and zone are required' });
    }
    const zoneDoc = await ShippingZone.findById(zone);
    if (!zoneDoc) return res.status(404).json({ success: false, message: 'Shipping zone not found' });
    const method = await ShippingMethod.create({
      name: name.trim(),
      description: description?.trim() || '',
      zone,
      feeType: feeType || 'fixed',
      baseFee: Number(baseFee) || 0,
      deliveryEstimate: deliveryEstimate?.trim() || '3-5 business days',
      minOrderAmount: Number(minOrderAmount) || 0,
      isPickup: isPickup === true,
      isActive: isActive !== false,
    });
    const populated = await method.populate('zone', 'name');
    res.status(201).json({ success: true, message: 'Shipping method created', data: { method: populated } });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, zone, feeType, baseFee, deliveryEstimate, minOrderAmount, isPickup, isActive } = req.body;
    const method = await ShippingMethod.findById(id);
    if (!method) return res.status(404).json({ success: false, message: 'Shipping method not found' });
    if (name) method.name = name.trim();
    if (description !== undefined) method.description = description.trim();
    if (zone) {
      const zoneDoc = await ShippingZone.findById(zone);
      if (!zoneDoc) return res.status(404).json({ success: false, message: 'Shipping zone not found' });
      method.zone = zone;
    }
    if (feeType) method.feeType = feeType;
    if (baseFee !== undefined) method.baseFee = Number(baseFee);
    if (deliveryEstimate) method.deliveryEstimate = deliveryEstimate.trim();
    if (minOrderAmount !== undefined) method.minOrderAmount = Number(minOrderAmount);
    if (isPickup !== undefined) method.isPickup = isPickup;
    if (isActive !== undefined) method.isActive = isActive;
    await method.save();
    const populated = await method.populate('zone', 'name');
    res.status(200).json({ success: true, message: 'Shipping method updated', data: { method: populated } });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    await ShippingMethod.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Shipping method deleted' });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN: PICKUP LOCATIONS -------------------------------------------------

export const adminGetPickupLocations = async (req, res, next) => {
  try {
    const locations = await PickupLocation.find({}).lean();
    res.status(200).json({ success: true, data: { locations } });
  } catch (error) {
    next(error);
  }
};

export const adminCreatePickupLocation = async (req, res, next) => {
  try {
    const { name, address, city, state, phone, openingHours, isActive } = req.body;
    if (!name || !address || !city || !state) {
      return res.status(400).json({ success: false, message: 'Name, address, city and state are required' });
    }
    const location = await PickupLocation.create({
      name: name.trim(), address: address.trim(), city: city.trim(),
      state: state.trim(), phone: phone?.trim() || '', openingHours: openingHours?.trim() || 'Mon – Sat: 9am – 6pm',
      isActive: isActive !== false,
    });
    res.status(201).json({ success: true, message: 'Pickup location created', data: { location } });
  } catch (error) {
    next(error);
  }
};

export const adminUpdatePickupLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, phone, openingHours, isActive } = req.body;
    const location = await PickupLocation.findById(id);
    if (!location) return res.status(404).json({ success: false, message: 'Pickup location not found' });
    if (name) location.name = name.trim();
    if (address) location.address = address.trim();
    if (city) location.city = city.trim();
    if (state) location.state = state.trim();
    if (phone !== undefined) location.phone = phone.trim();
    if (openingHours !== undefined) location.openingHours = openingHours.trim();
    if (isActive !== undefined) location.isActive = isActive;
    await location.save();
    res.status(200).json({ success: true, message: 'Pickup location updated', data: { location } });
  } catch (error) {
    next(error);
  }
};

export const adminDeletePickupLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await PickupLocation.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Pickup location deleted' });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN: SHIPPING SETTINGS -------------------------------------------------

export const adminGetSettings = async (req, res, next) => {
  try {
    const settings = await getShippingSettings();
    res.status(200).json({ success: true, data: { settings } });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateSettings = async (req, res, next) => {
  try {
    const {
      shippingEnabled, freeShippingEnabled, freeShippingThreshold, freeShippingZones,
      pickupEnabled, trackingEnabled, defaultDeliveryEstimate, currency,
    } = req.body;
    let settings = await ShippingSetting.findOne({ key: 'global' });
    if (!settings) settings = new ShippingSetting({ key: 'global' });
    if (shippingEnabled !== undefined) settings.shippingEnabled = shippingEnabled;
    if (freeShippingEnabled !== undefined) settings.freeShippingEnabled = freeShippingEnabled;
    if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = Number(freeShippingThreshold);
    if (freeShippingZones !== undefined) settings.freeShippingZones = freeShippingZones;
    if (pickupEnabled !== undefined) settings.pickupEnabled = pickupEnabled;
    if (trackingEnabled !== undefined) settings.trackingEnabled = trackingEnabled;
    if (defaultDeliveryEstimate !== undefined) settings.defaultDeliveryEstimate = defaultDeliveryEstimate;
    if (currency !== undefined) settings.currency = currency.toUpperCase();
    await settings.save();
    res.status(200).json({ success: true, message: 'Shipping settings updated', data: { settings } });
  } catch (error) {
    next(error);
  }
};
