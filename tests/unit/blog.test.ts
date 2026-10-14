import { describe, expect, it } from "vitest";
import { parseArticle, readingMinutes, slugify } from "@/lib/blog/markdown";
import { blogPostSchema } from "@/lib/blog/schema";
import { coverUrl, parseCoverFile } from "@/lib/blog/images";

describe("parseArticle", () => {
  it("maps the text format onto article blocks", () => {
    const blocks = parseArticle(
      ["Intro line one", "continues here.", "", "## Section", "### Sub", "- one", "* two", "", "1. first", "2) second", "", "> Tip:", "> keep going", "", "Last."].join("\n"),
    );
    expect(blocks).toEqual([
      { type: "p", text: "Intro line one continues here." },
      { type: "h2", text: "Section" },
      { type: "h3", text: "Sub" },
      { type: "ul", items: ["one", "two"] },
      { type: "ol", items: ["first", "second"] },
      { type: "callout", text: "Tip: keep going" },
      { type: "p", text: "Last." },
    ]);
  });

  it("closes a paragraph when a list or heading starts without a blank line", () => {
    expect(parseArticle("Before\n- item\nAfter\n## Next")).toEqual([
      { type: "p", text: "Before" },
      { type: "ul", items: ["item"] },
      { type: "p", text: "After" },
      { type: "h2", text: "Next" },
    ]);
  });

  it("never turns text into markup", () => {
    expect(parseArticle("<script>alert(1)</script>")).toEqual([{ type: "p", text: "<script>alert(1)</script>" }]);
    // A single # is not a heading level the site uses.
    expect(parseArticle("# Title")).toEqual([{ type: "p", text: "# Title" }]);
  });

  it("handles Windows line endings and blank input", () => {
    expect(parseArticle("a\r\n\r\nb")).toEqual([{ type: "p", text: "a" }, { type: "p", text: "b" }]);
    expect(parseArticle("  \n\n")).toEqual([]);
  });
});

describe("readingMinutes", () => {
  it("estimates at ~200 words a minute, minimum one", () => {
    expect(readingMinutes("short")).toBe(1);
    expect(readingMinutes(Array(1000).fill("word").join(" "))).toBe(5);
  });
});

describe("slugify", () => {
  it("makes clean URL slugs", () => {
    expect(slugify("How to Choose a POS System in Kenya?")).toBe("how-to-choose-a-pos-system-in-kenya");
    expect(slugify("  Café & Restaurant — Tips!  ")).toBe("cafe-and-restaurant-tips");
    expect(slugify("x".repeat(150))).toHaveLength(100);
  });
});

describe("blogPostSchema", () => {
  const valid = {
    title: "How to choose a POS system",
    slug: "how-to-choose-a-pos-system",
    excerpt: "A practical guide to comparing POS systems for Kenyan shops and restaurants.",
    category: "Retail",
    author: "Mavqo Digital Team",
    body: "word ".repeat(60),
    seoTitle: "",
    seoDescription: "",
    ctaLabel: "",
    ctaHref: "",
    coverSource: "library",
    imageSrc: "/images/retail-pos.webp",
    imageAlt: "POS terminal on a counter",
    published: true,
    publishedAt: "",
  };

  it("fills search fields and the call to action from sensible defaults", () => {
    const out = blogPostSchema.parse(valid);
    expect(out.seoTitle).toBe(valid.title);
    expect(out.seoDescription).toBe(valid.excerpt);
    expect(out.ctaHref).toBe("/contact/");
  });

  it("rejects bad slugs, external links and unknown library images", () => {
    const issues = (over: object) => blogPostSchema.safeParse({ ...valid, ...over }).error?.issues.map((i) => i.path.at(-1));
    expect(issues({ slug: "Bad Slug" })).toContain("slug");
    expect(issues({ slug: "double--hyphen" })).toContain("slug");
    expect(issues({ ctaHref: "https://evil.example" })).toContain("ctaHref");
    expect(issues({ ctaHref: "//evil.example" })).toContain("ctaHref");
    expect(issues({ imageSrc: "/images/not-a-real-file.webp" })).toContain("imageSrc");
    expect(issues({ publishedAt: "14/10/2026" })).toContain("publishedAt");
  });

  it("asks for a search title when the title is too long to reuse", () => {
    const r = blogPostSchema.safeParse({ ...valid, title: "A".repeat(90) });
    expect(r.error?.issues.map((i) => i.path.at(-1))).toContain("seoTitle");
  });
});

describe("cover URLs", () => {
  it("round-trips the post id and rejects anything else", () => {
    const id = "3f2a6c1e-8b4d-4e2a-9c1f-0a1b2c3d4e5f";
    const url = coverUrl({ id, imageType: "image/webp", imageUpdatedAt: new Date(1760000000000) });
    expect(url).toBe(`/media/blog/${id}-1760000000000.webp`);
    expect(parseCoverFile(url!.split("/").pop()!)).toEqual({ id });
    expect(parseCoverFile("../../etc/passwd")).toBeNull();
    expect(parseCoverFile(`${id}-1.svg`)).toBeNull();
    expect(coverUrl({ id, imageType: null, imageUpdatedAt: null })).toBeNull();
  });
});
