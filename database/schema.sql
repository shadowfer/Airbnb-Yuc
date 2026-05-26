
CREATE DATABASE IF NOT EXISTS hospedaje_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS hospedaje_db_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospedaje_db;


CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('guest', 'host', 'admin') NOT NULL DEFAULT 'guest',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NULL,
  avatar_url VARCHAR(500) NULL,

  stripe_customer_id VARCHAR(100) NULL,
  stripe_account_id VARCHAR(100) NULL,

  identity_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at TIMESTAMP NULL,

  reset_password_token VARCHAR(255) NULL DEFAULT NULL,
  reset_password_expires DATETIME NULL DEFAULT NULL,

  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_is_active (is_active),
  INDEX idx_users_deleted_at (deleted_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE identity_verifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  stripe_session_id VARCHAR(200) NULL,
  status ENUM('pending', 'processing', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  document_type VARCHAR(50) NULL,
  rejection_reason VARCHAR(255) NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_iv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_iv_user_id (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE properties (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  host_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  property_type ENUM(
    'apartment',
    'house',
    'room',
    'villa',
    'cabin',
    'other'
  ) NOT NULL DEFAULT 'apartment',

  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,

  price_per_night DECIMAL(10, 2) NOT NULL,
  max_guests TINYINT UNSIGNED NOT NULL DEFAULT 1,
  bedrooms TINYINT UNSIGNED NOT NULL DEFAULT 1,
  bathrooms TINYINT UNSIGNED NOT NULL DEFAULT 1,

  amenities JSON NULL,
  house_rules TEXT NULL,

  status ENUM('draft', 'active', 'paused', 'deleted') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_prop_host FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_prop_host_id (host_id),
  INDEX idx_prop_city (city),
  INDEX idx_prop_status (status),
  INDEX idx_prop_lat_lng (lat, lng),
  INDEX idx_prop_price (price_per_night)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE property_photos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  cloudinary_id VARCHAR(200) NOT NULL,
  order_index TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_photo_prop FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  INDEX idx_photos_prop_id (property_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;




CREATE TABLE availability (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED NOT NULL,
  blocked_date DATE NOT NULL,
  reason ENUM('reservation', 'host_block') NOT NULL DEFAULT 'host_block',
  reservation_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_avail_prop FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE KEY uq_avail (property_id, blocked_date),
  INDEX idx_avail_prop_date (property_id, blocked_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE reservations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED NOT NULL,
  guest_id INT UNSIGNED NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count TINYINT UNSIGNED NOT NULL DEFAULT 1,

  total_price DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  host_payout DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  status ENUM(
    'pending',
    'confirmed',
    'rejected',
    'cancelled',
    'completed'
  ) NOT NULL DEFAULT 'pending',
  guest_notes TEXT NULL,

  cancelled_at TIMESTAMP NULL,
  cancel_reason VARCHAR(500) NULL,
  cancelled_by INT UNSIGNED NULL,
  refund_amount DECIMAL(10, 2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_res_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE RESTRICT,
  CONSTRAINT fk_res_guest FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_res_cancelled FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE
  SET NULL,
    CONSTRAINT chk_dates CHECK (check_out > check_in),
    INDEX idx_res_property_id (property_id),
    INDEX idx_res_guest_id (guest_id),
    INDEX idx_res_status (status),
    INDEX idx_res_dates (check_in, check_out)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reservation_id INT UNSIGNED NOT NULL,
  payer_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  host_payout DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  stripe_payment_intent_id VARCHAR(200) NOT NULL,
  stripe_transfer_id VARCHAR(200) NULL,
  stripe_charge_id VARCHAR(200) NULL,

  status ENUM(
    'pending',
    'authorized',
    'released',
    'refunded',
    'failed'
  ) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP NULL,
  released_at TIMESTAMP NULL,
  refunded_at TIMESTAMP NULL,
  refund_amount DECIMAL(10, 2) NULL,
  stripe_refund_id VARCHAR(200) NULL,
  receipt_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pay_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pay_payer FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_stripe_pi (stripe_payment_intent_id),
  INDEX idx_pay_res_id (reservation_id),
  INDEX idx_pay_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reservation_id INT UNSIGNED NOT NULL,
  sender_id INT UNSIGNED NOT NULL,
  receiver_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_msg_res FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_msg_res_id (reservation_id),
  INDEX idx_msg_sender (sender_id),
  INDEX idx_msg_receiver (receiver_id),
  INDEX idx_msg_is_read (is_read)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;


CREATE TABLE reviews (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reservation_id INT UNSIGNED NOT NULL,
  reviewer_id INT UNSIGNED NOT NULL,
  reviewee_id INT UNSIGNED NULL,
  property_id INT UNSIGNED NULL,
  rating DECIMAL(2, 1) NOT NULL,
  comment TEXT NOT NULL,
  type ENUM('guest_to_property', 'host_to_guest') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_rev_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_rev_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_rev_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_rev_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_review_per_res (reservation_id, reviewer_id, type),
  CONSTRAINT chk_rating CHECK (
    rating >= 1.0
    AND rating <= 5.0
  ),
  INDEX idx_rev_property (property_id),
  INDEX idx_rev_reviewer (reviewer_id),
  INDEX idx_rev_reviewee (reviewee_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  type ENUM(
    'new_message',
    'reservation_request',
    'reservation_confirmed',
    'reservation_rejected',
    'reservation_cancelled',
    'payment_received',
    'payment_released',
    'review_received',
    'identity_verified'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSON NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user_read (user_id, is_read),
  INDEX idx_notif_type (type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE platform_config (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value VARCHAR(500) NOT NULL,
  description VARCHAR(255) NULL,
  updated_by INT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_config_admin FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE
  SET NULL,
    INDEX idx_config_key (config_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO platform_config (config_key, config_value, description)
VALUES (
    'platform_fee_percent',
    '12',
    'Porcentaje de comisión de la plataforma (10-15)'
  );

ALTER TABLE availability
ADD CONSTRAINT fk_avail_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE
SET NULL;

CREATE VIEW property_ratings AS
SELECT property_id,
  ROUND(AVG(rating), 1) AS avg_rating,
  COUNT(*) AS total_reviews
FROM reviews
WHERE type = 'guest_to_property'
GROUP BY property_id;

CREATE VIEW host_dashboard AS
SELECT p.host_id,
  COUNT(DISTINCT p.id) AS total_properties,
  COUNT(DISTINCT r.id) AS total_reservations,
  COUNT(
    DISTINCT CASE
      WHEN r.status = 'confirmed' THEN r.id
    END
  ) AS confirmed_reservations,
  COALESCE(
    SUM(
      CASE
        WHEN pay.status = 'released' THEN pay.host_payout
      END
    ),
    0
  ) AS total_earnings,
  COALESCE(
    SUM(
      CASE
        WHEN pay.status = 'authorized' THEN pay.host_payout
      END
    ),
    0
  ) AS pending_earnings
FROM properties p
  LEFT JOIN reservations r ON r.property_id = p.id
  LEFT JOIN payments pay ON pay.reservation_id = r.id
GROUP BY p.host_id;