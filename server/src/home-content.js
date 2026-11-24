import { z } from "zod";

const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const text = (length) => z.string().trim().min(1).max(length);
const optional = (length) =>
  z.string().trim().max(length).nullable().optional();
const imageAsset = z
  .string()
  .regex(/^[a-z0-9-]+\.webp$/)
  .max(255)
  .nullable()
  .optional();
const slideAsset = z
  .string()
  .regex(/^[a-z0-9-]+\.(webp|mp4)$/)
  .max(255)
  .nullable()
  .optional();
const mediaId = text(191).nullable().optional();
const commonPerson = {
  name: text(160),
  nameTa: optional(160),
  nameHi: optional(160),
  designation: text(200),
  designationTa: optional(200),
  designationHi: optional(200),
  imageId: mediaId,
  imageAsset,
};

export const homeContentSchemas = {
  "home-slides": z
    .object({
      kind: z.enum(["IMAGE", "VIDEO"]),
      alt: text(255),
      altTa: optional(255),
      altHi: optional(255),
      mediaId,
      asset: slideAsset,
      videoUrl: z.string().trim().url().max(1000).nullable().optional(),
      posterId: mediaId,
      duration: z.number().int().min(3).max(30).default(7),
      sortOrder: z.number().int().min(0).max(9999).default(0),
      status,
    })
    .strict()
    .refine(
      (value) =>
        value.kind === "IMAGE"
          ? !!(value.mediaId || value.asset?.endsWith(".webp"))
          : !!(
              value.mediaId ||
              value.videoUrl ||
              value.asset?.endsWith(".mp4")
            ),
      {
        message: "Choose slide media or add an HTTPS video URL.",
        path: ["mediaId"],
      },
    )
    .refine(
      (value) =>
        value.kind !== "VIDEO" || !value.asset || value.asset.endsWith(".mp4"),
      { message: "Video slide assets must be MP4 files.", path: ["asset"] },
    ),
  "principal-desks": z
    .object({
      title: text(255),
      titleTa: optional(255),
      titleHi: optional(255),
      ...commonPerson,
      message: text(20000),
      messageTa: optional(20000),
      messageHi: optional(20000),
      status,
    })
    .strict(),
  leadership: z
    .object({
      ...commonPerson,
      tenure: optional(80),
      legacy: text(5000),
      legacyTa: optional(5000),
      legacyHi: optional(5000),
      quote: optional(1000),
      quoteTa: optional(1000),
      quoteHi: optional(1000),
      groupId: mediaId,
      sortOrder: z.number().int().min(0).max(9999).default(0),
      status,
    })
    .strict(),
  "leadership-groups": z
    .object({
      title: text(160),
      titleTa: optional(160),
      titleHi: optional(160),
      sortOrder: z.number().int().min(0).max(9999).default(0),
      status,
    })
    .strict(),
};

const publicImage = {
  select: {
    id: true,
    alt: true,
    altTa: true,
    altHi: true,
    mimeType: true,
    status: true,
    hasVariants: true,
  },
};
const cleanMedia = (item) => (item?.status === "PUBLISHED" ? item : null);
export function mountHomeContent(app, db, databaseOnly) {
  app.get("/api/home-slides", databaseOnly, async (_req, res) => {
    const items = await db.homeSlide.findMany({
      where: { status: "PUBLISHED" },
      include: { media: publicImage, poster: publicImage },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    res.json({
      items: items
        .map((item) => ({
          ...item,
          media: cleanMedia(item.media),
          poster: cleanMedia(item.poster),
        }))
        .filter((item) =>
          item.kind === "IMAGE"
            ? item.media || item.asset?.endsWith(".webp")
            : item.media || item.videoUrl || item.asset?.endsWith(".mp4"),
        ),
    });
  });
  app.get("/api/principal-desk", databaseOnly, async (_req, res) => {
    const item = await db.principalDesk.findFirst({
      where: { status: "PUBLISHED" },
      include: { image: publicImage },
      orderBy: { updatedAt: "desc" },
    });
    if (!item)
      return res
        .status(404)
        .json({ error: "Principal desk has not been published." });
    res.json({ ...item, image: cleanMedia(item.image) });
  });
  app.get("/api/leadership", databaseOnly, async (_req, res) => {
    const [groupRecords, leaderRecords] = await Promise.all([
      db.leadershipGroup.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      db.leaderProfile.findMany({
        where: { status: "PUBLISHED" },
        include: { image: publicImage },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
    ]);
    const items = leaderRecords.map((item) => ({
      ...item,
      image: cleanMedia(item.image),
    }));
    const groups = groupRecords.map((group) => ({
      ...group,
      items: items.filter((item) => item.groupId === group.id),
    }));
    const ungrouped = items.filter(
      (item) => !groups.some((group) => group.id === item.groupId),
    );
    if (ungrouped.length) {
      if (groups.length) groups[0].items.push(...ungrouped);
      else
        groups.push({
          id: "leadership-archive",
          title: "Leadership archive",
          titleTa: "தலைமைத்துவக் காப்பகம்",
          titleHi: "नेतृत्व अभिलेखागार",
          sortOrder: 0,
          items: ungrouped,
        });
    }
    res.json({ groups, items });
  });
}
