const fs = require('fs');
const { Property, PropertyPhoto, User } = require('./src/models'); 
const sequelize = require('./src/config/database'); 

// Helper to extract numeric price per night
function extractPricePerNight(priceObj) {
  if (!priceObj) return 1200;

  // Option 1: Parse basePrice description e.g. "5 noches x $1,600.00 MXN"
  const baseDesc = priceObj.breakDown?.basePrice?.description || '';
  const matchBase = baseDesc.match(/x\s*\$([0-9,]+(?:\.[0-9]+)?)/i);
  if (matchBase && matchBase[1]) {
    const parsed = parseFloat(matchBase[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Option 2: Parse total price e.g. "$9,640 MXN" and divide by 5
  const totalPriceStr = priceObj.price || priceObj.label || '';
  const matchTotal = totalPriceStr.match(/\$([0-9,]+(?:\.[0-9]+)?)/);
  if (matchTotal && matchTotal[1]) {
    const totalVal = parseFloat(matchTotal[1].replace(/,/g, ''));
    if (!isNaN(totalVal) && totalVal > 0) {
      return parseFloat((totalVal / 5).toFixed(2));
    }
  }

  return 1200;
}

// Helper to map property type to ENUM ('apartment','house','room','villa','cabin','other')
function mapPropertyType(textStr) {
  const t = (textStr || '').toLowerCase();
  if (t.includes('villa')) return 'villa';
  if (t.includes('cabaña') || t.includes('cabin')) return 'cabin';
  if (t.includes('casa') || t.includes('house') || t.includes('home') || t.includes('colonial')) return 'house';
  if (t.includes('depto') || t.includes('departamento') || t.includes('apartamento') || t.includes('condo') || t.includes('apartment') || t.includes('loft')) return 'apartment';
  if (t.includes('cuarto') || t.includes('habitacion') || t.includes('habitación') || t.includes('room') || t.includes('suite')) return 'room';
  return 'house'; // fallback to house for Airbnb listings
}

// Helper to extract amenities from description
function extractAmenities(description) {
  const desc = (description || '').toLowerCase();
  const amenities = [];
  if (desc.includes('wifi') || desc.includes('wi-fi') || desc.includes('internet')) amenities.push('wifi');
  if (desc.includes('alberca') || desc.includes('piscina') || desc.includes('pool')) amenities.push('pool');
  if (desc.includes('estacionamiento') || desc.includes('parking') || desc.includes('cochera') || desc.includes('garage')) amenities.push('parking');
  if (desc.includes('climatizada') || desc.includes('aire acondicionado') || desc.includes('clima') || desc.includes('ac')) amenities.push('ac');
  if (desc.includes('cocina') || desc.includes('kitchen')) amenities.push('kitchen');
  if (desc.includes('asador') || desc.includes('parrillada') || desc.includes('bbq')) amenities.push('heating');
  if (desc.includes('gimnasio') || desc.includes('gym')) amenities.push('gym');
  if (desc.includes('mascota') || desc.includes('pets') || desc.includes('pet friendly')) amenities.push('pets');
  
  if (amenities.length === 0) {
    amenities.push('wifi', 'ac');
  }
  return amenities;
}

// Helper to parse numeric capacity
function parseCapacity(desc, fallback) {
  const text = (desc || '').toLowerCase();
  const match = text.match(/(?:capacidad|aloja|hasta|para)\s*(?:a|para)?\s*(\d+)\s*(?:personas|huéspedes|huespedes)/);
  if (match && match[1]) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0 && val <= 30) return val;
  }
  return fallback;
}

const importData = async () => {
  try {
    // 1. Authenticate DB connection
    await sequelize.authenticate();
    console.log('⚡ Conexión a base de datos exitosa.');

    // 2. Ensure default host user exists (ID 1)
    let host = await User.findByPk(1);
    if (!host) {
      host = await User.create({
        firstName: 'Anfitrión',
        lastName: 'Yucatán',
        email: 'anfitrion@airbnb-yucatan.com',
        password: 'Password123!',
        role: 'host',
        isVerified: true,
      });
      console.log('👤 Usuario anfitrión principal creado con ID:', host.id);
    }

    // 3. Read JSON data
    const rawData = fs.readFileSync('./tus_propiedades.json', 'utf8');
    const sourceProperties = JSON.parse(rawData);

    console.log(`🚀 Importando ${sourceProperties.length} propiedades reales de Airbnb Yucatán...`);

    let importedCount = 0;
    let photoCount = 0;

    for (const item of sourceProperties) {
      const pricePerNight = extractPricePerNight(item.price);
      const propertyType = mapPropertyType((item.title || '') + ' ' + (item.description || ''));
      const lat = item.coordinates?.latitude || 20.97537;
      const lng = item.coordinates?.longitude || -89.61696;
      const maxGuests = parseCapacity(item.description, 4);
      const amenities = extractAmenities(item.description);

      // Create property in DB
      const createdProperty = await Property.create({
        hostId: host.id,
        title: item.title || 'Hospedaje en Yucatán',
        description: (item.description || 'Increíble hospedaje en Yucatán').substring(0, 2000),
        propertyType,
        address: 'Mérida, Yucatán, México',
        city: 'Mérida',
        state: 'Yucatán',
        country: 'México',
        lat,
        lng,
        pricePerNight,
        maxGuests,
        bedrooms: 2,
        bathrooms: 2,
        amenities,
        status: 'active',
      });

      importedCount++;

      // Save main thumbnail image if present
      if (item.thumbnail) {
        await PropertyPhoto.create({
          propertyId: createdProperty.id,
          url: item.thumbnail,
          cloudinaryId: 'imported_' + createdProperty.id,
          orderIndex: 0,
        });
        photoCount++;
      }
    }

    console.log(`✅ ¡Importación completada con éxito!`);
    console.log(`📊 Total de propiedades importadas: ${importedCount}`);
    console.log(`🖼️ Total de fotos guardadas: ${photoCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al importar:', error);
    process.exit(1);
  }
};

importData();