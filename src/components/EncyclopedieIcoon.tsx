"use client";

import { useEffect, useRef } from "react";
import { HudResourceType, IcoonSvg } from "@/components/ResourceIcoon";
import { tekenEncyclopedieTile } from "@/render/canvas";
import { isStadsverbeteringIcoonSleutel, StadsverbeteringIcoon, StadsverbeteringIcoonSleutel } from "./StadsverbeteringIcoon";

// Icoontjes voor de encyclopedie (issue "Encyclopedie mooier"). De encyclopedie
// is een naslagwerk: een icoon moet exact hetzelfde zijn als in het spel. Daarom
// worden hier geen eigen plaatjes getekend, maar de echte spel-tekenaars
// hergebruikt: grondstoffen via dezelfde `IcoonSvg` als de ResourceHud, en
// gebouwen/roofdieren via de tegel-tekenfuncties van de kaart (canvas.ts).
const TEGEL_SLEUTELS = [
  "boerderij",
  "mijn",
  "goudmijn",
  "steengroeve",
  "houtkap",
  "wachttoren",
  "heiligdom",
  "sterrencirkel",
  "offer-altaar",
  "legerkamp",
  "saloon",
  "courthouse",
  "ranch",
  "roofdier",
] as const;

export type TegelIcoonSleutel = (typeof TEGEL_SLEUTELS)[number];
export type EncyclopedieIcoonSleutel = TegelIcoonSleutel | HudResourceType | StadsverbeteringIcoonSleutel;

function isTegelSleutel(sleutel: EncyclopedieIcoonSleutel): sleutel is TegelIcoonSleutel {
  return (TEGEL_SLEUTELS as readonly string[]).includes(sleutel);
}

function TegelCanvas({
  sleutel,
  onrust,
  tegelSet,
  grootte,
}: {
  sleutel: TegelIcoonSleutel;
  onrust: boolean;
  tegelSet?: string;
  grootte: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const px = Math.round(grootte * dpr);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, grootte, grootte);
    tekenEncyclopedieTile(ctx, grootte, sleutel === "roofdier" ? { roofdier: true } : { improvementId: sleutel }, {
      onrust,
      tegelSet,
    });
  }, [sleutel, onrust, tegelSet, grootte, dpr]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      width={px}
      height={px}
      style={{ width: grootte, height: grootte, flexShrink: 0, borderRadius: "0.2rem" }}
    />
  );
}

export function EncyclopedieIcoon({
  sleutel,
  onrust = false,
  tegelSet,
  grootte = 40,
}: {
  sleutel: EncyclopedieIcoonSleutel;
  onrust?: boolean;
  // `undefined` = tutorial-uiterlijk, "going-west" = Going West-uiterlijk (zie
  // `CampaignConfig.tegelSet`); gelijk aan wat de kaart per campagne toont.
  tegelSet?: string;
  grootte?: number;
}) {
  if (isStadsverbeteringIcoonSleutel(sleutel)) {
    return <StadsverbeteringIcoon sleutel={sleutel} grootte={grootte} />;
  }
  if (!isTegelSleutel(sleutel)) {
    return (
      <span aria-hidden="true" style={{ display: "inline-flex", lineHeight: 0, flexShrink: 0 }}>
        <IcoonSvg type={sleutel} />
      </span>
    );
  }
  return <TegelCanvas sleutel={sleutel} onrust={onrust} tegelSet={tegelSet} grootte={grootte} />;
}

export interface IcoonRijItem {
  icoon: EncyclopedieIcoonSleutel;
  onrust?: boolean;
}

// Meerdere icoontjes naast elkaar (bv. een streek die "vol staat" met
// onrust-gebouwen).
export function IcoonRij({ items, tegelSet }: { items: IcoonRijItem[]; tegelSet?: string }) {
  return (
    <span style={{ display: "inline-flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center" }}>
      {items.map((item, i) => (
        <EncyclopedieIcoon key={i} sleutel={item.icoon} onrust={item.onrust} tegelSet={tegelSet} />
      ))}
    </span>
  );
}
