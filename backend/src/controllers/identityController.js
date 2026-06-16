const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? require('stripe')(stripeSecret) : null;
const cloudinary = require('../config/cloudinary');
const IdentityVerification = require('../models/IdentityVerification');
const User = require('../models/User');

const verifyIdentity = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, proporciona un documento de identidad (.jpg, .png o .pdf).',
      });
    }

    const existing = await IdentityVerification.findOne({
      where: {
        userId: req.user.id,
        status: ['pending', 'processing'],
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes un proceso de verificación en curso.',
      });
    }

    const useFallback = !stripe || process.env.STRIPE_IDENTITY_FALLBACK === 'true';

    if (useFallback) {
      let result;
      const isCloudinaryConfigured = process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_KEY !== 'tu_api_key' && 
        process.env.CLOUDINARY_API_KEY !== 'test_key';

      if (isCloudinaryConfigured) {
        const uploadToCloudinary = (fileBuffer, userId) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: `airbnb/identity/${userId}`,
                resource_type: 'auto',
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            uploadStream.end(fileBuffer);
          });
        };
        result = await uploadToCloudinary(req.file.buffer, req.user.id);
      } else {
        // Local fallback for identity documents
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../../uploads/identity', String(req.user.id));
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);

        const serverUrl = `${req.protocol}://${req.get('host')}`;
        result = {
          secure_url: `${serverUrl}/uploads/identity/${req.user.id}/${filename}`,
          public_id: `identity/${req.user.id}/${filename}`,
        };
      }

      await req.user.update({ identityStatus: 'verified' });

      const verification = await IdentityVerification.create({
        userId: req.user.id,
        stripeSessionId: `mock_session_${Date.now()}`,
        status: 'verified',
        documentType: req.file.mimetype.includes('pdf') ? 'pdf' : 'id_card',
        verifiedAt: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: 'Simulación de verificación exitosa. Identidad verificada.',
        status: 'verified',
        verification,
        data: {
          status: 'verified',
          verification,
        },
      });
    }

    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      options: {
        document: {
          require_id_number: false,
          require_matching_selfie: false,
        },
      },
      metadata: {
        userId: req.user.id,
      },
    });

    const verification = await IdentityVerification.create({
      userId: req.user.id,
      stripeSessionId: session.id,
      status: 'processing',
      documentType: 'document',
    });

    await req.user.update({ identityStatus: 'pending' });

    res.status(200).json({
      success: true,
      message: 'Sesión de verificación de Stripe creada.',
      session_id: session.id,
      client_secret: session.client_secret,
      url: session.url,
      verification,
      data: {
        session_id: session.id,
        client_secret: session.client_secret,
        url: session.url,
        verification,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getIdentityStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const lastVerification = await IdentityVerification.findOne({
      where: { userId: req.user.id },
      order: [['created_at', 'DESC']],
    });

    // If the user has never submitted an identity verification document,
    // their status is effectively 'none' (or unverified) even if the default DB value is 'pending'
    const status = lastVerification ? user.identityStatus : 'none';

    res.status(200).json({
      success: true,
      status: status,
      verified_at: lastVerification ? lastVerification.verifiedAt : null,
      rejection_reason: lastVerification ? lastVerification.rejectionReason : null,
      data: {
        status: status,
        verified_at: lastVerification ? lastVerification.verifiedAt : null,
        rejection_reason: lastVerification ? lastVerification.rejectionReason : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const handleStripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && stripe && sig) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = req.body;
    }

    if (!event || !event.type) {
      return res.status(400).json({
        success: false,
        message: 'Evento inválido.',
      });
    }

    const session = event.data.object;

    if (event.type === 'identity.verification_session.verified') {
      const verification = await IdentityVerification.findOne({
        where: { stripeSessionId: session.id },
      });
      if (verification) {
        await verification.update({
          status: 'verified',
          verifiedAt: new Date(),
        });
        await User.update(
          { identityStatus: 'verified' },
          { where: { id: verification.userId } }
        );
      }
    } else if (event.type === 'identity.verification_session.requires_input') {
      const verification = await IdentityVerification.findOne({
        where: { stripeSessionId: session.id },
      });
      if (verification) {
        const reason = session.last_error?.code || 'verification_failed';
        await verification.update({
          status: 'rejected',
          rejectionReason: reason,
        });
        await User.update(
          { identityStatus: 'rejected' },
          { where: { id: verification.userId } }
        );
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

module.exports = {
  verifyIdentity,
  getIdentityStatus,
  handleStripeWebhook,
};
