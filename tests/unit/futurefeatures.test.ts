import { test } from "node:test";
import assert from "node:assert/strict";
import { fitQuestion, recommendSize } from "../../src/lib/fitfinder.ts";
import { dominantSwatches, familyOf } from "../../src/lib/colormatch.ts";
import * as G from "../../src/data/size-guides.ts";

test("size finder reads chest, waist and foot charts", () => {
  assert.equal(fitQuestion(G.TOP_REGULAR)?.kind, "chest");
  assert.equal(fitQuestion(G.WOMEN_TOP)?.label, "Your bust");
  assert.equal(fitQuestion(G.BOTTOM_MEN)?.kind, "waist");
  assert.equal(fitQuestion(G.FOOTWEAR_UNISEX)?.kind, "foot");
  assert.equal(fitQuestion(null), null);
});

test("size finder picks the smallest size with enough ease", () => {
  const q = fitQuestion(G.TOP_REGULAR)!;
  assert.equal(recommendSize(G.TOP_REGULAR, q, 37, "regular").size, "M"); // needs 40
  assert.equal(recommendSize(G.TOP_REGULAR, q, 37, "snug").size, "S"); // needs 38
  assert.equal(recommendSize(G.TOP_REGULAR, q, 37, "relaxed").size, "L"); // needs 42
  assert.equal(recommendSize(G.TOP_REGULAR, q, 50, "regular").size, null);
  const f = fitQuestion(G.FOOTWEAR_UNISEX)!;
  assert.equal(recommendSize(G.FOOTWEAR_UNISEX, f, 25.0, "regular").size, "UK 7");
});

test("colour families", () => {
  assert.equal(familyOf(20, 20, 20), "Black");
  assert.equal(familyOf(250, 250, 248), "White");
  assert.equal(familyOf(30, 60, 160), "Blue");
  assert.equal(familyOf(40, 120, 60), "Green");
  assert.equal(familyOf(200, 30, 40), "Red");
  assert.equal(familyOf(110, 70, 40), "Brown");
});

test("dominant swatches rank by share", () => {
  const px = new Uint8ClampedArray(4 * 100);
  for (let i = 0; i < 100; i++) {
    const blue = i < 70;
    px.set(blue ? [30, 60, 160, 255] : [240, 240, 240, 255], i * 4);
  }
  const s = dominantSwatches(px);
  assert.equal(s[0].family, "Blue");
  assert.ok(Math.abs(s[0].share - 0.7) < 0.01);
  assert.equal(s[1].family, "White");
});
