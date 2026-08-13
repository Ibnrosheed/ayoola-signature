import Address from '../models/address.model.js';

/**
 * @desc    Get all addresses for authenticated user
 * @route   GET /api/addresses
 * @access  Private
 */
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new address
 * @route   POST /api/addresses
 * @access  Private
 */
export const createAddress = async (req, res, next) => {
  try {
    const { fullName, phone, address, city, state, country, deliveryInstructions, isDefault } = req.body;

    if (!fullName || !phone || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: fullName, phone, address, city, state',
      });
    }

    // Check if this is the first address for the user
    const addressCount = await Address.countDocuments({ user: req.user._id });
    const makeDefault = addressCount === 0 ? true : !!isDefault;

    // If making default, unset other defaults
    if (makeDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const newAddress = await Address.create({
      user: req.user._id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country || 'Nigeria',
      deliveryInstructions: deliveryInstructions || '',
      isDefault: makeDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { address: newAddress },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an address
 * @route   PUT /api/addresses/:id
 * @access  Private
 */
export const updateAddress = async (req, res, next) => {
  try {
    const { fullName, phone, address, city, state, country, deliveryInstructions, isDefault } = req.body;
    const { id } = req.params;

    const existingAddress = await Address.findOne({ _id: id, user: req.user._id });
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or unauthorized',
      });
    }

    if (isDefault && !existingAddress.isDefault) {
      // If we are setting this address as default, unset others
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
      existingAddress.isDefault = true;
    } else if (isDefault === false && existingAddress.isDefault) {
      // Cannot unset default if it's the only one or if user has other addresses, but if they unset it,
      // we check if they have other addresses to make default. Let's keep it default if it's the only one.
      const totalCount = await Address.countDocuments({ user: req.user._id });
      if (totalCount > 1) {
        existingAddress.isDefault = false;
        // set another address as default
        const anotherAddress = await Address.findOne({ _id: { $ne: id }, user: req.user._id });
        if (anotherAddress) {
          anotherAddress.isDefault = true;
          await anotherAddress.save();
        }
      }
    }

    if (fullName) existingAddress.fullName = fullName.trim();
    if (phone) existingAddress.phone = phone.trim();
    if (address) existingAddress.address = address.trim();
    if (city) existingAddress.city = city.trim();
    if (state) existingAddress.state = state.trim();
    if (country) existingAddress.country = country;
    if (deliveryInstructions !== undefined) existingAddress.deliveryInstructions = deliveryInstructions;

    await existingAddress.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: { address: existingAddress },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an address
 * @route   DELETE /api/addresses/:id
 * @access  Private
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or unauthorized',
      });
    }

    const wasDefault = address.isDefault;
    await Address.deleteOne({ _id: id });

    // If it was default, make another address default
    if (wasDefault) {
      const anotherAddress = await Address.findOne({ user: req.user._id });
      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set default address
 * @route   PATCH /api/addresses/:id/default
 * @access  Private
 */
export const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or unauthorized',
      });
    }

    // Set all other user addresses isDefault to false
    await Address.updateMany({ user: req.user._id }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Address set as default successfully',
      data: { address },
    });
  } catch (error) {
    next(error);
  }
};
