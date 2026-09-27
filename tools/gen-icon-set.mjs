#!/usr/bin/env node
/**
 * The icon set, emitted and verified.
 *
 *   node tools/gen-icon-set.mjs           write src/react/primitives/icon-set.ts
 *   node tools/gen-icon-set.mjs --check   fail if it is stale, or if any name
 *                                         no longer resolves in react-icons
 *
 * The --check mode is the reason this is a generator rather than a file.
 * react-icons renames glyphs between minor versions — LuTrash2,
 * LuLoaderCircle and LuGrid3X3 all moved, and LuGrid3x3 (lowercase x) is what
 * a reasonable person writes and is not a thing. A renamed import is
 * `undefined`, React renders nothing, and the failure is a blank space on a
 * page rather than an error anybody sees. Resolving every name against the
 * installed package turns that into a build failure.
 */

import * as Lu from "react-icons/lu";
const GROUPS = {
  "Navigation": {
    menu:"LuMenu", close:"LuX", search:"LuSearch", home:"LuHouse", arrowLeft:"LuArrowLeft",
    arrowRight:"LuArrowRight", arrowUp:"LuArrowUp", arrowDown:"LuArrowDown",
    chevronLeft:"LuChevronLeft", chevronRight:"LuChevronRight", chevronUp:"LuChevronUp",
    chevronDown:"LuChevronDown", chevronsRight:"LuChevronsRight", externalLink:"LuExternalLink",
    cornerDownRight:"LuCornerDownRight", moveRight:"LuMoveRight", panelLeft:"LuPanelLeft",
  },
  "Actions": {
    plus:"LuPlus", minus:"LuMinus", check:"LuCheck", copy:"LuCopy", trash:"LuTrash2",
    edit:"LuPencil", download:"LuDownload", upload:"LuUpload", share:"LuShare2",
    refresh:"LuRefreshCw", undo:"LuUndo2", redo:"LuRedo2", save:"LuSave", send:"LuSend",
    filter:"LuFilter", sliders:"LuSlidersHorizontal", settings:"LuSettings", sort:"LuArrowUpDown",
    maximize:"LuMaximize2", minimize:"LuMinimize2", move:"LuMove", scissors:"LuScissors",
  },
  "Status": {
    alert:"LuCircleAlert", info:"LuInfo", help:"LuCircleHelp", success:"LuCircleCheck",
    error:"LuCircleX", warning:"LuTriangleAlert", ban:"LuBan", loader:"LuLoaderCircle",
    shieldCheck:"LuShieldCheck", badgeCheck:"LuBadgeCheck", flag:"LuFlag", bell:"LuBell",
    bellOff:"LuBellOff", sparkles:"LuSparkles", zap:"LuZap",
  },
  "Media": {
    play:"LuPlay", pause:"LuPause", stop:"LuSquare", skipForward:"LuSkipForward",
    skipBack:"LuSkipBack", volume:"LuVolume2", volumeOff:"LuVolumeX", mic:"LuMic",
    micOff:"LuMicOff", camera:"LuCamera", video:"LuVideo", image:"LuImage",
    images:"LuImages", headphones:"LuHeadphones", radio:"LuRadio", film:"LuFilm",
    subtitles:"LuCaptions",
  },
  "Files": {
    fileText:"LuFileText", file:"LuFile", files:"LuFiles", folder:"LuFolder",
    folderOpen:"LuFolderOpen", archive:"LuArchive", clipboard:"LuClipboard",
    book:"LuBook", bookOpen:"LuBookOpen", newspaper:"LuNewspaper", notebook:"LuNotebook",
    printer:"LuPrinter", paperclip:"LuPaperclip", fileCheck:"LuFileCheck",
    fileDown:"LuFileDown", scroll:"LuScrollText",
  },
  "Communication": {
    mail:"LuMail", mailOpen:"LuMailOpen", phone:"LuPhone", message:"LuMessageSquare",
    messages:"LuMessagesSquare", quote:"LuQuote", megaphone:"LuMegaphone",
    atSign:"LuAtSign", rss:"LuRss", reply:"LuReply", inbox:"LuInbox",
  },
  "People": {
    user:"LuUser", users:"LuUsers", userPlus:"LuUserPlus", userCheck:"LuUserCheck",
    contact:"LuContact", idCard:"LuIdCard", handshake:"LuHandshake", smile:"LuSmile",
    heart:"LuHeart", star:"LuStar", award:"LuAward", trophy:"LuTrophy",
  },
  "Commerce": {
    cart:"LuShoppingCart", bag:"LuShoppingBag", tag:"LuTag", tags:"LuTags",
    receipt:"LuReceipt", creditCard:"LuCreditCard", wallet:"LuWallet", percent:"LuPercent",
    package:"LuPackage", packageCheck:"LuPackageCheck", truck:"LuTruck", store:"LuStore",
    gift:"LuGift", barcode:"LuBarcode", scan:"LuScanLine", coins:"LuCoins",
  },
  "Time": {
    calendar:"LuCalendar", calendarDays:"LuCalendarDays", calendarCheck:"LuCalendarCheck",
    clock:"LuClock", timer:"LuTimer", hourglass:"LuHourglass", history:"LuHistory",
    alarm:"LuAlarmClock",
  },
  "Place": {
    mapPin:"LuMapPin", map:"LuMap", compass:"LuCompass", navigation:"LuNavigation",
    globe:"LuGlobe", building:"LuBuilding2", warehouse:"LuWarehouse", factory:"LuFactory",
    plane:"LuPlane", train:"LuTrainFront", car:"LuCar", bike:"LuBike", route:"LuRoute",
    briefcase:"LuBriefcase",
  },
  "Data": {
    barChart:"LuChartColumn", lineChart:"LuChartLine", pieChart:"LuChartPie",
    trendingUp:"LuTrendingUp", trendingDown:"LuTrendingDown", activity:"LuActivity",
    gauge:"LuGauge", table:"LuTable", database:"LuDatabase", hash:"LuHash",
    calculator:"LuCalculator", target:"LuTarget",
  },
  "Layout": {
    layers:"LuLayers", layoutGrid:"LuLayoutGrid", layoutList:"LuLayoutList",
    columns:"LuColumns3", rows:"LuRows3", sidebar:"LuPanelRight", square:"LuSquare",
    circle:"LuCircle", grid:"LuGrid3X3", expand:"LuExpand", shrink:"LuShrink",
    alignLeft:"LuAlignLeft", alignCenter:"LuAlignCenter",
  },
  "System": {
    lock:"LuLock", unlock:"LuLockOpen", key:"LuKey", shield:"LuShield",
    eye:"LuEye", eyeOff:"LuEyeOff", link:"LuLink", unlink:"LuUnlink",
    bookmark:"LuBookmark", pin:"LuPin", code:"LuCode", terminal:"LuTerminal",
    cpu:"LuCpu", server:"LuServer", wifi:"LuWifi", wifiOff:"LuWifiOff",
    monitor:"LuMonitor", smartphone:"LuSmartphone", tablet:"LuTablet",
    accessibility:"LuAccessibility", languages:"LuLanguages", moon:"LuMoon", sun:"LuSun",
  },
  "Nature": {
    leaf:"LuLeaf", trees:"LuTrees", flame:"LuFlame", droplet:"LuDroplet",
    cloud:"LuCloud", wind:"LuWind", snowflake:"LuSnowflake", mountain:"LuMountain",
    waves:"LuWaves", sprout:"LuSprout",
  },
  "Objects": {
    coffee:"LuCoffee", utensils:"LuUtensils", wrench:"LuWrench", hammer:"LuHammer",
    paintbrush:"LuPaintbrush", palette:"LuPalette", ruler:"LuRuler", lightbulb:"LuLightbulb",
    battery:"LuBatteryFull", plug:"LuPlug", recycle:"LuRecycle", stethoscope:"LuStethoscope",
    graduationCap:"LuGraduationCap", puzzle:"LuPuzzle", dice:"LuDices", anchor:"LuAnchor",
  },
};
let missing=[], total=0, names=new Set();
for (const [g,set] of Object.entries(GROUPS))
  for (const [k,v] of Object.entries(set)) {
    total++;
    if (names.has(k)) missing.push(`DUPLICATE KIT NAME ${k}`);
    names.add(k);
    if (!(v in Lu)) missing.push(`${g}.${k} -> ${v}`);
  }
const CHECK = process.argv.includes("--check");
console.log("icon set —", total, "names,", Object.keys(GROUPS).length, "groups");
if (missing.length) {
  console.error("names that no longer resolve in react-icons:\n  " + missing.join("\n  "));
  process.exit(1);
}
console.log("every name resolves against the installed react-icons");
// legacy names must survive
const legacy="alert arrowLeft arrowRight bookmark briefcase building calendar check chevronDown chevronLeft chevronRight chevronUp clock close copy download edit externalLink eye eyeOff fileText filter hash heart home image info layers layoutGrid link lock mail mapPin menu mic minus newspaper pause phone play plus search settings share sliders sparkles star tag trash unlock upload user users".split(" ");
/* The 48 names that shipped before the set was deepened. Dropping one is a
   breaking change for every consumer that used it, and the kind that compiles
   fine until the page renders — so it is a hard failure rather than a note. */
const lost=legacy.filter(n=>!names.has(n));
if (lost.length) {
  console.error("names removed from the public set: " + lost.join(" "));
  process.exit(1);
}
console.log("all", legacy.length, "original names preserved");

/* ---- emit ---- */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
const used = [...new Set(Object.values(GROUPS).flatMap(s => Object.values(s)))].sort();
const header = `/**
 * The icon set.
 *
 * Lucide, by way of react-icons, and the choice was decided by one property
 * rather than by taste. Lucide draws every glyph as an open stroke and puts
 * the weight in \`stroke-width\` — a real CSS property — so icon weight can be
 * a token and resolve through the cascade like everything else in the kit.
 *
 * Phosphor was the other candidate and is the larger set, but its six weights
 * are six separate React components (PiHouse, PiHouseBold, PiHouseThin, …).
 * A custom property cannot select a component, so a Phosphor weight would
 * have had to be a prop threaded through every call site or a React context
 * — which is exactly the shape this kit avoids. The set with fewer glyphs and
 * a cascading weight is worth more here than the set with more glyphs and a
 * weight the cascade cannot reach.
 *
 * ${used.length} glyphs, ${Object.keys(GROUPS).length} groups. Curated rather than exhaustive: Lucide
 * ships ${Object.keys(Lu).length >= 1500 ? "roughly 1,500" : String(Object.keys(Lu).length)} and importing all of them would put every one in the
 * bundle to serve the handful a page uses. The groups below are the vocabulary
 * a marketing site, a catalogue and a form actually need, and adding to them
 * is a one-line change — the cost of a missing icon is low, the cost of
 * shipping a thousand unused ones is paid by every visitor.
 *
 * GENERATED by tools/gen-icon-set.mjs from a table checked against the
 * installed react-icons. Every name in it resolved at generation time, which
 * is the check that matters: react-icons renames glyphs between versions
 * (LuTrash2, LuLoaderCircle, LuGrid3X3 all moved), and a name that has gone
 * away is an undefined component and a blank space on the page.
 */

import type { ComponentType, SVGProps } from "react";
import {
${used.map(n => "  " + n + ",").join("\n")}
} from "react-icons/lu";

type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

`;
const body = `/* Kit name to glyph. The kit's names are the stable surface: a consumer
   writes name="trash" and never learns that the glyph behind it is called
   LuTrash2 this month. Every rename upstream is absorbed here. */
export const icons = {
${Object.entries(GROUPS).map(([g, set]) =>
  `  /* --- ${g} --- */\n` + Object.entries(set).map(([k, v]) => `  ${/^[a-z][a-zA-Z0-9]*$/.test(k) ? k : JSON.stringify(k)}: ${v},`).join("\n")
).join("\n\n")}
} satisfies Record<string, Glyph>;

/**
 * The same names, grouped, for the catalogue.
 *
 * A flat list of ${used.length} icons is a wall nobody reads. The groups are how
 * somebody looking for "the one that means delivery" actually searches, and
 * they are declared here rather than in the story so the catalogue cannot
 * drift from the set it documents.
 */
export const ICON_GROUPS: Record<string, readonly string[]> = {
${Object.entries(GROUPS).map(([g, set]) =>
  `  ${JSON.stringify(g)}: [${Object.keys(set).map(k => JSON.stringify(k)).join(", ")}],`
).join("\n")}
};
`;
const OUT = "src/react/primitives/icon-set.ts";
const next = header + body;
// Compare as LF: git checks files out CRLF on Windows.
const prev = existsSync(OUT) ? readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : null;
if (prev === next) {
  console.log(`${OUT} current — ${used.length} glyphs`);
} else if (CHECK) {
  console.error(`stale  ${OUT} — run: node tools/gen-icon-set.mjs`);
  process.exit(1);
} else {
  writeFileSync(OUT, next, "utf8");
  console.log(`${prev === null ? "wrote" : "update"} ${OUT} — ${used.length} glyphs`);
}
