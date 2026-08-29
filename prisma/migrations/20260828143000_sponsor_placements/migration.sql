ALTER TABLE `SponsorSlot`
  ADD COLUMN `placement` ENUM(
    'HERO_BILLBOARD',
    'PROJECTS_CORNER',
    'PROJECTS_STRIP',
    'ABOUT_SIDECAR',
    'MERCH_BANNER',
    'FOOTER_STAMP'
  ) NULL;

UPDATE `SponsorSlot` SET `placement` = 'HERO_BILLBOARD' WHERE `id` = 'sponsor_home_hero';
UPDATE `SponsorSlot` SET `placement` = 'PROJECTS_CORNER' WHERE `id` = 'sponsor_home_signal';
UPDATE `SponsorSlot` SET `placement` = 'ABOUT_SIDECAR' WHERE `id` = 'sponsor_home_indie';

CREATE UNIQUE INDEX `SponsorSlot_placement_key` ON `SponsorSlot`(`placement`);

INSERT INTO `SponsorSlot`
  (`id`, `placement`, `name`, `description`, `basePrice`, `minIncrement`, `enabled`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES
  ('sponsor_projects_strip', 'PROJECTS_STRIP', 'Between the work', 'A wide interruption between project discoveries.', 4000, 2000, true, 25, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('sponsor_merch_banner', 'MERCH_BANNER', 'Merch intermission', 'A generous banner alongside the things we make.', 5000, 2500, true, 40, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('sponsor_footer_stamp', 'FOOTER_STAMP', 'One last thing', 'A small persistent wink before the footer.', 1500, 750, true, 50, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
