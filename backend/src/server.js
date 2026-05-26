


require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;


const startServer = async () => {
  try {

    await sequelize.authenticate();
    console.log('✅ Conexión con MySQL establecida correctamente.');


    console.log('✅ Conexión con MySQL establecida correctamente.');


    app.listen(PORT, () => {
      console.log(`\n🏠 ═══════════════════════════════════════════`);
      console.log(`   Hospedaje App — Servidor iniciado`);
      console.log(`   Puerto: ${PORT}`);
      console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   BD: ${process.env.DB_NAME || 'hospedaje_db'}`);
      console.log(`═══════════════════════════════════════════════\n`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();