-- Expand the closed CropType enum into an extensible catalogue table.
-- Existing trade and price rows are preserved and converted to stable slugs.
CREATE TABLE "CropCatalog" (
  "id" TEXT NOT NULL,
  "canonicalName" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "productForm" TEXT,
  "localNameEnglish" TEXT NOT NULL,
  "localNameHindi" TEXT,
  "localNameKannada" TEXT,
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "supportedUnits" TEXT[] NOT NULL DEFAULT ARRAY['quintal', 'kilogram', 'tonne']::TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "translationReviewRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CropCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CropCatalog_slug_key" ON "CropCatalog"("slug");
CREATE INDEX "CropCatalog_category_isActive_idx" ON "CropCatalog"("category", "isActive");
CREATE INDEX "CropCatalog_canonicalName_idx" ON "CropCatalog"("canonicalName");

-- Provide catalogue rows for all legacy enum values before adding references.
INSERT INTO "CropCatalog" ("id", "canonicalName", "slug", "category", "localNameEnglish", "localNameHindi", "localNameKannada", "aliases", "supportedUnits", "translationReviewRequired", "updatedAt") VALUES
  ('legacy-crop-tomato', 'Tomato', 'tomato', 'Everyday vegetables', 'Tomato', 'टमाटर', 'ಟೊಮೆಟೊ', ARRAY['tomatoes']::TEXT[], ARRAY['quintal','kilogram','tonne']::TEXT[], true, CURRENT_TIMESTAMP),
  ('legacy-crop-maize', 'Maize', 'maize', 'Cereals and millets', 'Maize', 'मक्का', 'ಮೆಕ್ಕೆಜೋಳ', ARRAY['corn']::TEXT[], ARRAY['quintal','kilogram','tonne']::TEXT[], true, CURRENT_TIMESTAMP),
  ('legacy-crop-onion', 'Onion', 'onion', 'Everyday vegetables', 'Onion', 'प्याज', 'ಈರುಳ್ಳಿ', ARRAY['onions']::TEXT[], ARRAY['quintal','kilogram','tonne']::TEXT[], true, CURRENT_TIMESTAMP),
  ('legacy-crop-green-chilli', 'Green chilli', 'green-chilli', 'Everyday vegetables', 'Green chilli', 'हरी मिर्च', 'ಹಸಿ ಮೆಣಸಿನಕಾಯಿ', ARRAY['green chili','fresh green chilli']::TEXT[], ARRAY['quintal','kilogram','tonne']::TEXT[], true, CURRENT_TIMESTAMP);

ALTER TABLE "Listing" ALTER COLUMN "crop" TYPE TEXT USING "crop"::TEXT;
ALTER TABLE "Demand" ALTER COLUMN "crop" TYPE TEXT USING "crop"::TEXT;
ALTER TABLE "PriceRecord" ALTER COLUMN "crop" TYPE TEXT USING "crop"::TEXT;
ALTER TABLE "PriceAlert" ALTER COLUMN "crop" TYPE TEXT USING "crop"::TEXT;

UPDATE "Listing" SET "crop" = CASE "crop" WHEN 'Tomato' THEN 'tomato' WHEN 'Maize' THEN 'maize' WHEN 'Onion' THEN 'onion' WHEN 'Green_chilli' THEN 'green-chilli' ELSE LOWER("crop") END;
UPDATE "Demand" SET "crop" = CASE "crop" WHEN 'Tomato' THEN 'tomato' WHEN 'Maize' THEN 'maize' WHEN 'Onion' THEN 'onion' WHEN 'Green_chilli' THEN 'green-chilli' ELSE LOWER("crop") END;
UPDATE "PriceRecord" SET "crop" = CASE "crop" WHEN 'Tomato' THEN 'tomato' WHEN 'Maize' THEN 'maize' WHEN 'Onion' THEN 'onion' WHEN 'Green_chilli' THEN 'green-chilli' ELSE LOWER("crop") END;
UPDATE "PriceAlert" SET "crop" = CASE "crop" WHEN 'Tomato' THEN 'tomato' WHEN 'Maize' THEN 'maize' WHEN 'Onion' THEN 'onion' WHEN 'Green_chilli' THEN 'green-chilli' ELSE LOWER("crop") END;

ALTER TABLE "Listing" ADD CONSTRAINT "Listing_crop_fkey" FOREIGN KEY ("crop") REFERENCES "CropCatalog"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Demand" ADD CONSTRAINT "Demand_crop_fkey" FOREIGN KEY ("crop") REFERENCES "CropCatalog"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceRecord" ADD CONSTRAINT "PriceRecord_crop_fkey" FOREIGN KEY ("crop") REFERENCES "CropCatalog"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_crop_fkey" FOREIGN KEY ("crop") REFERENCES "CropCatalog"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
