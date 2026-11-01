import assert from "node:assert/strict";
import test from "node:test";
import { finalizeDiaryReply, parseDiaryReply, sanitizeDiaryReply } from "./diary-reply";

test("parseDiaryReply reads JSON and ignores surrounding text", () => {
  const parsed = parseDiaryReply('```json\n{"reply":"受け取ったよ。","sensitive":false}\n```');
  assert.deepEqual(parsed, { reply: "受け取ったよ。", sensitive: false });
  assert.equal(parseDiaryReply("返事だけ"), null);
});

test("sensitive replies use a calm fallback and are marked sensitive", () => {
  const result = finalizeDiaryReply("kind", { reply: "もっとがんばれ", sensitive: true });
  assert.equal(result.sensitive, true);
  assert.match(result.reply, /専門家/);
  assert.ok(result.reply.length <= 150);
});

test("a broken reply falls back without marking sensitive", () => {
  const result = finalizeDiaryReply("coach", null);
  assert.equal(result.sensitive, false);
  assert.ok(result.reply.length > 0);
});

test("sanitizeDiaryReply drops links and emails", () => {
  assert.equal(sanitizeDiaryReply("見て https://example.com と a@b.co だよ"), "見て と だよ");
});
