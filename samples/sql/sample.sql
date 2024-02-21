
CREATE TABLE IF NOT EXISTS `addresses` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `s_id` bigint(20) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `addresses_s_id_index` (`s_id`),
  KEY `index_addresses_on_updated_at` (`updated_at`),
  KEY `index_addresses_on_s_id_and_id` (`s_id`, `id`)
);

SELECT *
FROM my_table m
WHERE m.status = "success"
  AND m.name = "foobar"
  OR m.id = 5
  AND m.is_not_deleted

ALTER TABLE IF EXISTS my_table
  ADD COLUMN IF NOT EXISTS val4 DATE,
  ALTER COLUMN val5 DROP NOT NULL, -- comment, ignore me!
  DROP COLUMN IF EXISTS val8;

UPDATE table_a as a
SET d = 5
FROM table_b b
INNER JOIN table_c c ON c.b = b.uid
WHERE b.a = a.uid;
