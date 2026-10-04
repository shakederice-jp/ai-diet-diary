import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getAdvisor, type AdvisorId } from "@/lib/advisors";
import type { ShareCard } from "@/lib/share-store";
import { SHARE_BRAND, SHARE_DISCLAIMER, SHARE_DOMAIN, situationBubble } from "@/lib/share-situations";

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

let fontData: Buffer | null = null;

function shareFont() {
  if (!fontData) {
    fontData = readFileSync(path.join(process.cwd(), "assets", "fonts", "ZenKakuGothicNew-Medium.ttf"));
  }
  return fontData;
}

function portraitSrc(id: AdvisorId) {
  const file = path.join(process.cwd(), "public", "characters", `${id}.svg`);
  if (!existsSync(file)) {
    return null;
  }
  return `data:image/svg+xml;base64,${readFileSync(file).toString("base64")}`;
}

function CharacterMark({ id, portrait }: { id: ShareCard["characterId"]; portrait: string | null }) {
  if (portrait) {
    return <img src={portrait} alt="" width={360} height={360} style={{ borderRadius: 48 }} />;
  }
  if (id === "sharp") {
    return (
      <div style={{ display: "flex", position: "relative", width: 360, height: 360 }}>
        <div style={{ display: "flex", position: "absolute", top: 18, left: 78, width: 0, height: 0, borderLeft: "34px solid transparent", borderRight: "34px solid transparent", borderBottom: "64px solid #E06E0C" }} />
        <div style={{ display: "flex", position: "absolute", top: 18, right: 78, width: 0, height: 0, borderLeft: "34px solid transparent", borderRight: "34px solid transparent", borderBottom: "64px solid #E06E0C" }} />
        <div style={{ display: "flex", position: "absolute", left: 40, top: 70, width: 280, height: 280, borderRadius: 140, background: "#F5821F" }} />
      </div>
    );
  }
  if (id === "kind") {
    return (
      <div style={{ display: "flex", position: "relative", width: 360, height: 360 }}>
        <div style={{ display: "flex", position: "absolute", left: 30, top: 70, width: 200, height: 200, borderRadius: 100, background: "#E7DCC8" }} />
        <div style={{ display: "flex", position: "absolute", left: 130, top: 110, width: 180, height: 180, borderRadius: 90, background: "#F5821F" }} />
      </div>
    );
  }
  if (id === "clerical") {
    return (
      <div style={{ display: "flex", width: 280, height: 280, background: "#F5821F", transform: "rotate(45deg)", borderRadius: 28 }} />
    );
  }
  if (id === "coach") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", width: 260, height: 90, background: "#E06E0C", borderRadius: 16 }} />
        <div style={{ display: "flex", width: 180, height: 150, background: "#F5821F", marginTop: -20 }} />
        <div style={{ display: "flex", width: 220, height: 36, background: "#C45A08", borderRadius: 8, marginTop: 8 }} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", width: 140, height: 140, borderRadius: 70, background: "#F5821F" }} />
      <div style={{ display: "flex", width: 220, height: 150, background: "#E7DCC8", borderRadius: 24, marginTop: 12, alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", width: 90, height: 110, background: "#F5821F", borderRadius: 12 }} />
      </div>
    </div>
  );
}

function imageOptions() {
  return {
    ...SHARE_IMAGE_SIZE,
    fonts: [
      {
        name: "ZenKaku",
        data: shareFont(),
        weight: 500 as const,
        style: "normal" as const,
      },
    ],
  };
}

function legacyCardImage(card: ShareCard) {
  const advisor = getAdvisor(card.characterId);
  const portrait = portraitSrc(card.characterId);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#E6D9C8",
          padding: 36,
          fontFamily: "ZenKaku",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            background: "#F3EBDD",
            borderRadius: 36,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 460,
              alignItems: "center",
              justifyContent: "center",
              background: "#FBF6EE",
            }}
          >
            <CharacterMark id={card.characterId} portrait={portrait} />
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 48,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", color: "#F5821F", fontSize: 28 }}>{advisor.name}</div>
              <div
                style={{
                  display: "flex",
                  marginTop: 28,
                  color: "#3F2A22",
                  fontSize: 40,
                  lineHeight: 1.45,
                }}
              >
                {card.text}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", color: "#3F2A22", fontSize: 26 }}>{SHARE_BRAND}</div>
              <div style={{ display: "flex", marginTop: 8, color: "#F5821F", fontSize: 22 }}>{SHARE_DOMAIN}</div>
              <div style={{ display: "flex", marginTop: 14, color: "#8A7564", fontSize: 18 }}>{SHARE_DISCLAIMER}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    imageOptions(),
  );
}

function chatCardImage(card: ShareCard) {
  const advisor = getAdvisor(card.characterId);
  const portrait = portraitSrc(card.characterId);
  const situation = card.situation ?? "";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#E6D9C8",
          padding: 36,
          fontFamily: "ZenKaku",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            background: "#FBF6EE",
            borderRadius: 36,
            padding: 40,
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: 760,
                background: "#F5821F",
                color: "#FFFFFF",
                borderRadius: 28,
                padding: "22px 28px",
              }}
            >
              <div style={{ display: "flex", fontSize: 22, color: "#FFE7CC" }}>わたし</div>
              <div style={{ display: "flex", marginTop: 8, fontSize: 36, lineHeight: 1.4 }}>{situationBubble(situation)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 28 }}>
            <div style={{ display: "flex", width: 148, height: 148, marginRight: 22 }}>
              {portrait ? (
                <img src={portrait} alt="" width={148} height={148} style={{ borderRadius: 28 }} />
              ) : (
                <CharacterMark id={card.characterId} portrait={null} />
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", color: "#F5821F", fontSize: 24 }}>{advisor.name}</div>
              <div
                style={{
                  display: "flex",
                  marginTop: 8,
                  background: "#F3EBDD",
                  color: "#3F2A22",
                  borderRadius: 28,
                  padding: "22px 28px",
                  fontSize: 34,
                  lineHeight: 1.4,
                }}
              >
                {card.text}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 24 }}>
            {card.streakDays ? (
              <div
                style={{
                  display: "flex",
                  background: "#E6D9C8",
                  color: "#6B5344",
                  borderRadius: 999,
                  padding: "8px 18px",
                  fontSize: 22,
                  marginRight: 12,
                }}
              >
                {`記録 ${card.streakDays}日目`}
              </div>
            ) : null}
            {card.weightLabel ? (
              <div
                style={{
                  display: "flex",
                  background: "#E6D9C8",
                  color: "#6B5344",
                  borderRadius: 999,
                  padding: "8px 18px",
                  fontSize: 22,
                }}
              >
                {card.weightLabel}
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
            <div style={{ display: "flex", color: "#3F2A22", fontSize: 22 }}>{SHARE_BRAND}</div>
            <div style={{ display: "flex", marginTop: 4, color: "#F5821F", fontSize: 20 }}>{SHARE_DOMAIN}</div>
            <div style={{ display: "flex", marginTop: 6, color: "#8A7564", fontSize: 18 }}>{SHARE_DISCLAIMER}</div>
          </div>
        </div>
      </div>
    ),
    imageOptions(),
  );
}

export function shareCardImage(card: ShareCard) {
  if (!card.situation) {
    return legacyCardImage(card);
  }
  return chatCardImage(card);
}
