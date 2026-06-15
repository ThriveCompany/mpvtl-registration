-- Restore missing Yes/No options for availability dropdown questions.
-- Some older form-builder rows were seeded with Maybe/Other only.

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "createdAt", "updatedAt")
SELECT
  concat('fqo_', substr(md5(concat(fq."id", ':Yes')), 1, 16)),
  fq."id",
  'Yes',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'dropdown'
  AND fq."questionText" ILIKE '%available%'
  AND NOT EXISTS (
    SELECT 1
    FROM "FormQuestionOption" fqo
    WHERE fqo."questionId" = fq."id"
      AND lower(fqo."value") = 'yes'
  );

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "createdAt", "updatedAt")
SELECT
  concat('fqo_', substr(md5(concat(fq."id", ':No')), 1, 16)),
  fq."id",
  'No',
  2,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'dropdown'
  AND fq."questionText" ILIKE '%available%'
  AND NOT EXISTS (
    SELECT 1
    FROM "FormQuestionOption" fqo
    WHERE fqo."questionId" = fq."id"
      AND lower(fqo."value") = 'no'
  );

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "createdAt", "updatedAt")
SELECT
  concat('fqo_', substr(md5(concat(fq."id", ':Maybe')), 1, 16)),
  fq."id",
  'Maybe',
  3,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'dropdown'
  AND fq."questionText" ILIKE '%available%'
  AND NOT EXISTS (
    SELECT 1
    FROM "FormQuestionOption" fqo
    WHERE fqo."questionId" = fq."id"
      AND lower(fqo."value") = 'maybe'
  );

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "createdAt", "updatedAt")
SELECT
  concat('fqo_', substr(md5(concat(fq."id", ':Other')), 1, 16)),
  fq."id",
  'Other, please describe',
  4,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'dropdown'
  AND fq."questionText" ILIKE '%available%'
  AND NOT EXISTS (
    SELECT 1
    FROM "FormQuestionOption" fqo
    WHERE fqo."questionId" = fq."id"
      AND lower(fqo."value") = 'other, please describe'
  );
