import assert from "node:assert/strict";
import test from "node:test";
import { X_POST_LIMIT, buildXPost, xWeightedLength } from "./share-post";

const URL = "https://diet.finance-tower.com/s/example";
const NAME = "ツンデレ猫";

function post(input: { shareText: string; reply?: string; url?: string }) {
  return buildXPost({
    shareText: input.shareText,
    reply: input.reply ?? "",
    advisorName: NAME,
    url: input.url ?? URL,
  });
}

test("negative diary text keeps the user's line and a warm reply quote", () => {
  const built = post({
    shareText: "夜にがっつり食べてしまった",
    reply: "記録できたのは、えらいニャ。今日はここまでにしとく。",
  });
  assert.equal(
    built.text,
    [
      "夜にがっつり食べてしまった",
      "🐱ツンデレ猫「記録できたのは、えらいニャ。」",
      "同じように頑張ってる人、一緒に続けよう",
      "#ダイエット記録 #ダイエット仲間 #メモレバ",
      URL,
    ].join("\n"),
  );
  assert.equal(built.shortened, false);
  assert.ok(built.weight <= X_POST_LIMIT);
  assert.equal(built.text.includes("でも、"), false);
  assert.equal(built.text.includes("励まされた"), false);
});

test("positive diary text is not joined with a contrasting fixed phrase", () => {
  const built = post({
    shareText: "間食を我慢できた",
    reply: "がまんできたの、ちゃんと見てるニャ。えらい。",
  });
  assert.equal(
    built.text,
    [
      "間食を我慢できた",
      "🐱ツンデレ猫「がまんできたの、ちゃんと見てるニャ。」",
      "同じように頑張ってる人、一緒に続けよう",
      "#ダイエット記録 #ダイエット仲間 #メモレバ",
      URL,
    ].join("\n"),
  );
  assert.equal(built.text.includes("でも、"), false);
});

test("a post without a reply omits the advisor line", () => {
  const built = post({ shareText: "今日もちゃんと記録できた" });
  assert.equal(
    built.text,
    [
      "今日もちゃんと記録できた",
      "同じように頑張ってる人、一緒に続けよう",
      "#ダイエット記録 #ダイエット仲間 #メモレバ",
      URL,
    ].join("\n"),
  );
  assert.equal(built.text.includes("🐱"), false);
});

test("a long 80-character line and a long reply stay within the weighted limit", () => {
  const built = post({
    shareText: "あ".repeat(80),
    reply: `${"い".repeat(80)}。そのあとも続く。`,
  });
  assert.equal(
    built.text,
    [
      "あ".repeat(80),
      `🐱ツンデレ猫「${"い".repeat(14)}…」`,
      "#ダイエット記録 #ダイエット仲間 #メモレバ",
      URL,
    ].join("\n"),
  );
  assert.equal(built.shortened, true);
  assert.equal(built.weight, 273);
  assert.ok(built.weight <= X_POST_LIMIT);
  assert.equal(xWeightedLength(built.text), built.weight);
  assert.equal(built.text.includes("同じように頑張ってる人、一緒に続けよう"), false);
  assert.equal(built.text.includes("でも、"), false);
  assert.equal(built.text.includes("励まされた"), false);
});

test("an empty share line is left out", () => {
  const built = post({
    shareText: "   ",
    reply: "書いてくれて、ありがとニャ。",
  });
  assert.equal(
    built.text,
    [
      "🐱ツンデレ猫「書いてくれて、ありがとニャ。」",
      "同じように頑張ってる人、一緒に続けよう",
      "#ダイエット記録 #ダイエット仲間 #メモレバ",
      URL,
    ].join("\n"),
  );
  assert.equal(built.text.startsWith("夜"), false);
});

test("a sensitive reply is omitted when the caller does not pass it", () => {
  const built = post({
    shareText: "もう食べなくていいかも",
    reply: "",
  });
  assert.equal(built.text.includes("🐱"), false);
  assert.equal(built.text.split("\n")[0], "もう食べなくていいかも");
});

test("urls count as 23 and fullwidth characters count as 2", () => {
  assert.equal(xWeightedLength("あ"), 2);
  assert.equal(xWeightedLength("a"), 1);
  assert.equal(xWeightedLength(URL), 23);
  assert.equal(xWeightedLength(`あ\n${URL}`), 2 + 1 + 23);
});
