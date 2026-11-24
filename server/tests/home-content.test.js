import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { homeContentSchemas } from "../src/home-content.js";

const origin = "http://127.0.0.1:5173";
const token = "a".repeat(64),
  csrf = "b".repeat(64);
const auth = (req) =>
  req
    .set("Cookie", `school_session=${token}`)
    .set("Origin", origin)
    .set("x-csrf-token", csrf);
function model(methods = {}) {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...methods,
  };
}
function database() {
  const db = {
    homeSlide: model(),
    principalDesk: model(),
    leadershipGroup: model(),
    leaderProfile: model(),
    media: model(),
    auditLog: model(),
    session: model(),
    gallery: model(),
    galleryMedia: model(),
  };
  db.session.findUnique.mockResolvedValue({
    expiresAt: new Date(Date.now() + 60000),
    csrfToken: csrf,
    user: { id: "admin", active: true, role: { name: "ADMIN" } },
  });
  db.$transaction = (callback) => callback(db);
  return db;
}

describe("homepage content", () => {
  it("validates image and video slides without allowing empty media", () => {
    const base = {
      alt: "School life",
      altTa: null,
      altHi: null,
      duration: 7,
      sortOrder: 0,
      status: "PUBLISHED",
    };
    expect(
      homeContentSchemas["home-slides"].safeParse({
        ...base,
        kind: "IMAGE",
        asset: "campus-library.webp",
        mediaId: null,
        videoUrl: null,
        posterId: null,
      }).success,
    ).toBe(true);
    expect(
      homeContentSchemas["home-slides"].safeParse({
        ...base,
        kind: "VIDEO",
        mediaId: "video",
        asset: null,
        videoUrl: null,
        posterId: null,
      }).success,
    ).toBe(true);
    expect(
      homeContentSchemas["home-slides"].safeParse({
        ...base,
        kind: "VIDEO",
        mediaId: null,
        asset: "home-campus-video.mp4",
        videoUrl: null,
        posterId: null,
      }).success,
    ).toBe(true);
    expect(
      homeContentSchemas["home-slides"].safeParse({
        ...base,
        kind: "VIDEO",
        mediaId: null,
        asset: null,
        videoUrl: null,
        posterId: null,
      }).success,
    ).toBe(false);
  });

  it("returns only published records and hides draft linked media", async () => {
    const db = database();
    db.homeSlide.findMany.mockResolvedValue([
      {
        id: "one",
        kind: "IMAGE",
        asset: "st-antony-home.webp",
        media: null,
        poster: null,
      },
    ]);
    db.principalDesk.findFirst.mockResolvedValue({
      id: "principal",
      image: { id: "draft", status: "DRAFT" },
    });
    db.leadershipGroup.findMany.mockResolvedValue([
      { id: "archive", title: "School archive", status: "PUBLISHED" },
    ]);
    db.leaderProfile.findMany.mockResolvedValue([
      { id: "leader", image: { id: "draft", status: "DRAFT" } },
    ]);
    const app = createApp(db, { demo: false });
    expect(
      (await request(app).get("/api/home-slides").expect(200)).body.items,
    ).toHaveLength(1);
    expect(
      (await request(app).get("/api/principal-desk").expect(200)).body.image,
    ).toBeNull();
    expect(
      (await request(app).get("/api/leadership").expect(200)).body.items[0]
        .image,
    ).toBeNull();
  });

  it("accepts a published image slide in the authenticated CMS", async () => {
    const db = database();
    db.media.findUnique.mockResolvedValue({ mimeType: "image/webp" });
    db.homeSlide.create.mockImplementation(async ({ data }) => ({
      id: "created",
      ...data,
    }));
    const record = {
      kind: "IMAGE",
      alt: "Campus",
      altTa: null,
      altHi: null,
      mediaId: "photo",
      asset: null,
      videoUrl: null,
      posterId: null,
      duration: 7,
      sortOrder: 1,
      status: "PUBLISHED",
    };
    await auth(
      request(createApp(db, { demo: false })).post("/api/admin/home-slides"),
    )
      .send(record)
      .expect(201);
    expect(db.homeSlide.create).toHaveBeenCalledWith({ data: record });
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entity: "home-slides",
          action: "CREATE",
        }),
      }),
    );
  });
});
