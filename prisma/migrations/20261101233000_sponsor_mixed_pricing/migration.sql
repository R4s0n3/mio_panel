-- Mixed sponsor pricing. Idempotent: mio_page shares this database and may
-- already have added the same columns. Only adds columns; never renames or drops.

SET @pricing_mode_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'SponsorSlot'
    AND COLUMN_NAME = 'pricingMode'
);

SET @ddl := IF(
  @pricing_mode_exists = 0,
  'ALTER TABLE `SponsorSlot` ADD COLUMN `pricingMode` ENUM(''AUCTION'', ''FIXED'') NOT NULL DEFAULT ''AUCTION''',
  'SELECT 1'
);

PREPARE sponsor_pricing_mode_stmt FROM @ddl;
EXECUTE sponsor_pricing_mode_stmt;
DEALLOCATE PREPARE sponsor_pricing_mode_stmt;

SET @duration_days_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'SponsorSlot'
    AND COLUMN_NAME = 'durationDays'
);

SET @ddl := IF(
  @duration_days_exists = 0,
  'ALTER TABLE `SponsorSlot` ADD COLUMN `durationDays` INTEGER NULL',
  'SELECT 1'
);

PREPARE sponsor_duration_days_stmt FROM @ddl;
EXECUTE sponsor_duration_days_stmt;
DEALLOCATE PREPARE sponsor_duration_days_stmt;

SET @expires_at_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'SponsorBid'
    AND COLUMN_NAME = 'expiresAt'
);

SET @ddl := IF(
  @expires_at_exists = 0,
  'ALTER TABLE `SponsorBid` ADD COLUMN `expiresAt` DATETIME(3) NULL',
  'SELECT 1'
);

PREPARE sponsor_expires_at_stmt FROM @ddl;
EXECUTE sponsor_expires_at_stmt;
DEALLOCATE PREPARE sponsor_expires_at_stmt;

-- Fill fixed-price defaults only while a spot is still an auction with no term,
-- so a later panel edit is left alone.
UPDATE `SponsorSlot`
SET
  `pricingMode` = 'FIXED',
  `durationDays` = 30
WHERE `placement` IN (
  'PROJECTS_CORNER',
  'PROJECTS_STRIP',
  'ABOUT_SIDECAR',
  'MERCH_BANNER',
  'FOOTER_STAMP'
)
  AND `pricingMode` = 'AUCTION'
  AND `durationDays` IS NULL;
