const { Property, PropertyPhoto, User, Availability } = require('../models');
const { Op } = require('sequelize');

const createProperty = async (req, res, next) => {
  try {
    const {
      title,
      description,
      propertyType,
      address,
      city,
      state,
      country,
      lat,
      lng,
      pricePerNight,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities,
      houseRules,
    } = req.body;

    if (!title || !description || !propertyType || !address || !city || !country || lat === undefined || lng === undefined || pricePerNight === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser completados.',
        requiredFields: [
          'title',
          'description',
          'propertyType',
          'address',
          'city',
          'country',
          'lat',
          'lng',
          'pricePerNight',
        ],
      });
    }

    if (pricePerNight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio por noche debe ser mayor que 0.',
      });
    }

    let parsedAmenities = [];
    if (amenities !== undefined) {
      if (!Array.isArray(amenities)) {
        return res.status(400).json({
          success: false,
          message: 'Amenities debe ser un array de strings.',
        });
      }
      parsedAmenities = amenities;
    }

    const property = await Property.create({
      hostId: req.user.id,
      title,
      description,
      propertyType,
      address,
      city,
      state: state || null,
      country,
      lat,
      lng,
      pricePerNight,
      maxGuests: maxGuests || 1,
      bedrooms: bedrooms || 1,
      bathrooms: bathrooms || 1,
      amenities: parsedAmenities,
      houseRules: houseRules || null,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Propiedad creada exitosamente.',
      property,
      data: { property },
    });
  } catch (error) {
    next(error);
  }
};

const getMyProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: properties } = await Property.findAndCountAll({
      where: {
        hostId: req.user.id,
        status: {
          [Property.sequelize.Sequelize.Op.ne]: 'deleted',
        },
      },
      include: [
        {
          model: PropertyPhoto,
          as: 'photos',
          attributes: ['id', 'url', 'cloudinaryId', 'orderIndex'],
        },
      ],
      order: [
        ['created_at', 'DESC'],
        [{ model: PropertyPhoto, as: 'photos' }, 'order_index', 'ASC'],
      ],
      limit,
      offset,
      distinct: true,
    });

    const pages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      properties,
      total: count,
      page,
      pages,
      data: {
        properties,
        total: count,
        page,
        pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPropertyDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const property = await Property.findByPk(id, {
      include: [
        {
          model: User,
          as: 'host',
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email', 'phone', 'identityStatus', 'createdAt'],
        },
        {
          model: PropertyPhoto,
          as: 'photos',
          attributes: ['id', 'url', 'cloudinaryId', 'orderIndex'],
        },
      ],
      order: [
        [{ model: PropertyPhoto, as: 'photos' }, 'order_index', 'ASC'],
      ],
    });

    if (!property || property.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada.',
      });
    }

    const plainProperty = property.toJSON();
    plainProperty.reviews = [];
    plainProperty.avgRating = null;

    res.status(200).json({
      success: true,
      property: plainProperty,
      data: { property: plainProperty },
    });
  } catch (error) {
    next(error);
  }
};

const searchProperties = async (req, res, next) => {
  try {
    const {
      checkIn,
      checkOut,
      swLat,
      swLng,
      neLat,
      neLng,
      minPrice,
      maxPrice,
      propertyType,
      minGuests,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = req.query;

    const limitNum = parseInt(limit, 10) || 20;
    const pageNum = parseInt(page, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    const where = {
      status: 'active',
    };

    // Geolocation boundary search
    if (swLat !== undefined && swLng !== undefined && neLat !== undefined && neLng !== undefined) {
      where.lat = {
        [Op.between]: [parseFloat(swLat), parseFloat(neLat)],
      };
      where.lng = {
        [Op.between]: [parseFloat(swLng), parseFloat(neLng)],
      };
    }

    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter = {};
      if (minPrice !== undefined && minPrice !== '') {
        priceFilter[Op.gte] = parseFloat(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        priceFilter[Op.lte] = parseFloat(maxPrice);
      }
      if (Object.keys(priceFilter).length > 0) {
        where.pricePerNight = priceFilter;
      }
    }

    // Property type filters (comma separated)
    if (propertyType) {
      const types = propertyType.split(',');
      if (types.length === 1) {
        where.propertyType = types[0];
      } else {
        where.propertyType = {
          [Op.in]: types,
        };
      }
    }

    // Minimum guests filter
    if (minGuests !== undefined && minGuests !== '') {
      where.maxGuests = {
        [Op.gte]: parseInt(minGuests, 10),
      };
    }

    // Date range availability filter
    if (checkIn && checkOut) {
      const blockedAvailabilities = await Availability.findAll({
        where: {
          blockedDate: {
            [Op.gte]: checkIn,
            [Op.lt]: checkOut,
          },
        },
        attributes: ['propertyId'],
        raw: true,
      });

      const blockedPropertyIds = Array.from(new Set(blockedAvailabilities.map(a => a.propertyId)));
      if (blockedPropertyIds.length > 0) {
        where.id = {
          [Op.notIn]: blockedPropertyIds,
        };
      }
    }

    let order = [['created_at', 'DESC']];
    if (sort === 'price_asc') {
      order = [['price_per_night', 'ASC']];
    } else if (sort === 'price_desc') {
      order = [['price_per_night', 'DESC']];
    }

    const { count, rows: properties } = await Property.findAndCountAll({
      where,
      include: [
        {
          model: PropertyPhoto,
          as: 'photos',
          where: { orderIndex: 0 },
          required: false,
          limit: 1,
        },
      ],
      order,
      limit: limitNum,
      offset,
      distinct: true,
    });

    const pages = Math.ceil(count / limitNum);

    res.status(200).json({
      success: true,
      properties,
      total: count,
      page: pageNum,
      pages,
      data: {
        properties,
        total: count,
        page: pageNum,
        pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const property = req.property; 
    const {
      title,
      description,
      propertyType,
      address,
      city,
      state,
      country,
      lat,
      lng,
      pricePerNight,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities,
      houseRules,
      status,
    } = req.body;

    if (pricePerNight !== undefined && pricePerNight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio por noche debe ser mayor que 0.',
      });
    }

    if (amenities !== undefined && !Array.isArray(amenities)) {
      return res.status(400).json({
        success: false,
        message: 'Amenities debe ser un array de strings.',
      });
    }

    await property.update({
      title: title !== undefined ? title : property.title,
      description: description !== undefined ? description : property.description,
      propertyType: propertyType !== undefined ? propertyType : property.propertyType,
      address: address !== undefined ? address : property.address,
      city: city !== undefined ? city : property.city,
      state: state !== undefined ? state : property.state,
      country: country !== undefined ? country : property.country,
      lat: lat !== undefined ? lat : property.lat,
      lng: lng !== undefined ? lng : property.lng,
      pricePerNight: pricePerNight !== undefined ? pricePerNight : property.pricePerNight,
      maxGuests: maxGuests !== undefined ? maxGuests : property.maxGuests,
      bedrooms: bedrooms !== undefined ? bedrooms : property.bedrooms,
      bathrooms: bathrooms !== undefined ? bathrooms : property.bathrooms,
      amenities: amenities !== undefined ? amenities : property.amenities,
      houseRules: houseRules !== undefined ? houseRules : property.houseRules,
      status: status !== undefined ? status : property.status,
    });

    res.status(200).json({
      success: true,
      message: 'Propiedad actualizada correctamente.',
      property,
      data: { property },
    });
  } catch (error) {
    next(error);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    const property = req.property; 

    await property.update({ status: 'deleted' });

    res.status(200).json({
      success: true,
      message: 'Propiedad eliminada',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProperty,
  getMyProperties,
  getPropertyDetail,
  updateProperty,
  deleteProperty,
  searchProperties,
};
