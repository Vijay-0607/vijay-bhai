import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve('.');
const runtimeModules = 'C:/Users/VIJAY H/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { Presentation, PresentationFile } = await import(pathToFileURL(path.join(runtimeModules, '@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const utilPath = 'C:/Users/VIJAY H/.codex/plugins/cache/openai-primary-runtime/presentations/26.1009.11318/skills/presentations/container_tools/artifact_tool_utils.mjs';
const { makeNativeBulletParagraphs } = await import(pathToFileURL(utilPath).href);
const buildDir = path.join(root, '.pptx-build');
const outDir = path.join(root, 'output');
const finalPath = path.join(outDir, 'MandiMatch_Mentor_Presentation_Updated.pptx');
const W = 1280, H = 720;
const C = { ink: '#153D2B', green: '#1E5E3A', bright: '#00845A', yellow: '#F0B323', paper: '#F7F6F0', white: '#FFFFFF', muted: '#5F6B63', line: '#D8DED8', dark: '#101A15', pale: '#E9F1EB' };
const FONT = 'Aptos';
const ppt = Presentation.create({ slideSize: { width: W, height: H } });

function text(slide, value, x, y, w, h, size, color = C.ink, bold = false, opts = {}) {
  const s = slide.shapes.add({ geometry: 'textbox', name: opts.name, position: { left: x, top: y, width: w, height: h }, fill: 'none', line: { style: 'solid', fill: 'none', width: 0 } });
  s.text = value;
  s.text.style = { fontSize: size, bold, color, typeface: FONT, wrap: 'square', autoFit: 'shrinkText', verticalAlignment: opts.valign ?? 'top', alignment: opts.align ?? 'left', insets: 0 };
  return s;
}
function bullets(slide, items, x, y, w, h, size, color) {
  const s = slide.shapes.add({ geometry: 'textbox', position: { left: x, top: y, width: w, height: h }, fill: 'none', line: { style: 'solid', fill: 'none', width: 0 } });
  s.text = makeNativeBulletParagraphs(items, { marginLeftPoints: 20, hangingPoints: 10, spaceAfterPoints: 9 });
  s.text.style = { fontSize: size, color, typeface: FONT, wrap: 'square', autoFit: 'shrinkText', insets: 0 };
  return s;
}
function rule(slide, x, y, w, color = C.yellow, h = 4) {
  slide.shapes.add({ geometry: 'rect', position: { left: x, top: y, width: w, height: h }, fill: color, line: { style: 'solid', fill: color, width: 0 } });
}
function base(title, section, number, dark = false) {
  const slide = ppt.slides.add();
  slide.background.fill = dark ? C.dark : C.paper;
  text(slide, section.toUpperCase(), 72, 38, 520, 22, 13, dark ? '#9CD3B4' : C.bright, true);
  text(slide, title, 72, 72, 1120, 74, 42, dark ? C.white : C.ink, true);
  rule(slide, 72, 158, 70, C.yellow, 5);
  text(slide, `MANDIMATCH  ·  ${String(number).padStart(2, '0')}`, 72, 680, 360, 18, 12, dark ? '#9AA9A0' : C.muted, true);
  return slide;
}
async function image(slide, filepath, x, y, w, h, name) {
  const bytes = await fs.readFile(filepath);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  slide.images.add({ blob: buffer, contentType: 'image/png', alt: name, fit: 'cover', position: { left: x, top: y, width: w, height: h } });
}
function notes(slide, lines) { slide.speakerNotes.text = lines.join('\n'); }

// 1 — Cover
{
  const s = ppt.slides.add(); s.background.fill = C.ink;
  rule(s, 72, 94, 92, C.yellow, 6);
  text(s, 'MandiMatch', 72, 130, 520, 78, 58, C.white, true);
  text(s, 'Know your buyer and price\nbefore harvest.', 72, 225, 515, 130, 35, '#DDEBE0', true);
  text(s, 'A pre-harvest marketplace connecting farmers, FPOs, and produce buyers.', 74, 387, 470, 72, 22, '#B8C9BE');
  text(s, 'Mentor presentation  ·  Hackathon prototype', 74, 590, 500, 30, 16, '#9DB4A5', true);
  await image(s, path.join(buildDir, 'assets/dashboard.png'), 625, 99, 585, 460, 'MandiMatch farmer dashboard screenshot');
  text(s, 'Interface shown with sample demo data', 625, 572, 585, 22, 14, '#B8C9BE');
  notes(s, ['Introduce MandiMatch as a hackathon prototype for planning crop sales before harvest.', 'The dashboard screenshot is a user-provided screenshot from the project. Sample values shown in the interface are demonstration data, not measured project outcomes.', 'Sources: project README.md; supplied MandiMatch dashboard screenshot.']);
}

// 2 — Problem
{
  const s = base('The marketplace problem', 'Problem understanding', 2);
  text(s, 'Farmers and buyers need a clearer way to find one another and agree on a deal.', 72, 194, 1070, 72, 28, C.ink, true);
  const rows = [
    ['01', 'Supply is hard to discover', 'A buyer may not know which nearby farms have the crop and quantity they need.'],
    ['02', 'Price and timing are uncertain', 'Harvest dates, delivery windows, and price expectations can miss one another.'],
    ['03', 'Agreement takes coordination', 'Offers, counteroffers, and order status need a shared, understandable flow.'],
  ];
  rows.forEach(([n, head, body], i) => {
    const y = 306 + i * 106;
    text(s, n, 76, y, 60, 48, 30, C.bright, true);
    text(s, head, 158, y, 420, 37, 23, C.ink, true);
    text(s, body, 600, y + 1, 570, 54, 18, C.muted);
    if (i < rows.length - 1) rule(s, 158, y + 72, 1010, C.line, 1);
  });
  text(s, 'MandiMatch focuses on discovery and deal coordination; it does not guarantee a sale or a market price.', 72, 635, 1090, 26, 16, C.muted, false);
  notes(s, ['Frame these as the problem this prototype is designed to address, not as quantified research findings.', 'Sources: project README.md, Product Overview; problem framing for the MandiMatch prototype.']);
}

// 3 — Workflow
{
  const s = base('One workflow from crop plan to agreement', 'How it works', 3, true);
  text(s, 'Both sides describe what they can offer or need. MandiMatch helps them move toward a confirmed deal.', 72, 194, 1080, 58, 21, '#C6D5CC');
  const stages = [
    ['Farmer / FPO', 'Post crop, quantity, grade, price, location, harvest date'],
    ['Buyer', 'Post crop, quantity, budget, location, delivery date'],
    ['Match', 'Compare crop, quantity, price, dates, and district'],
    ['Negotiate', 'Send an offer, respond, or counteroffer'],
    ['Confirm', 'Confirm the deal; contact details become available'],
  ];
  const x0 = 72, gap = 28, boxW = 200, y = 310;
  stages.forEach(([head, body], i) => {
    const x = x0 + i * (boxW + gap);
    text(s, `0${i + 1}`, x, y, 48, 30, 17, C.yellow, true);
    text(s, head, x, y + 48, boxW, 36, 22, C.white, true);
    text(s, body, x, y + 96, boxW, 100, 17, '#B8C9BE');
    if (i < stages.length - 1) text(s, '→', x + boxW + 4, y + 48, 20, 30, 19, C.yellow, true);
  });
  rule(s, 72, 542, 1136, '#365846', 1);
  text(s, 'A contact number is shared only after the offer is accepted and a deal is confirmed.', 72, 570, 1080, 44, 21, '#DDEBE0', true);
  notes(s, ['Walk through the flow: farmers and FPOs list upcoming produce, buyers post demand, the matching engine surfaces compatible pairs, and users negotiate.', 'Phone contacts are displayed after confirmation in the deal flow.', 'Sources: src/pages/BuyPage.tsx; src/pages/SellPage.tsx; src/pages/MatchesPage.tsx; src/pages/DashboardPage.tsx; server/src/modules/offers/offers.controller.ts.']);
}

// 4 — Matching logic
{
  const s = base('Matching weighs fit, not just crop name', 'Technical implementation and functions', 4);
  text(s, 'A match score combines four practical signals:', 72, 194, 740, 44, 23, C.ink, true);
  const factors = [
    ['40%', 'Quantity fit', 'Can the available lot cover the buyer’s need?'],
    ['25%', 'Price fit', 'Does the ask fit within the buyer’s budget?'],
    ['20%', 'Date fit', 'Do harvest and delivery dates line up?'],
    ['15%', 'District fit', 'How close are the listed locations?'],
  ];
  factors.forEach(([weight, label, explain], i) => {
    const y = 270 + i * 86;
    text(s, weight, 78, y, 125, 45, 31, C.bright, true);
    text(s, label, 224, y + 1, 240, 36, 22, C.ink, true);
    text(s, explain, 490, y + 2, 650, 42, 18, C.muted);
    if (i < factors.length - 1) rule(s, 224, y + 58, 920, C.line, 1);
  });
  text(s, 'Eligible crop pairs score from 0–100; the prototype displays matches from 35 upward.', 72, 635, 1090, 24, 16, C.muted);
  notes(s, ['Explain the score as a weighted compatibility heuristic. A higher score means the listed quantities, budgets, dates, and districts fit better; it is not a prediction of deal success.', 'Sources: src/utils/matching.ts; server/src/utils/matching.ts; README.md, How the Matching Engine Works.']);
}

// 5 — Practical trust and price
{
  const s = base('Clearer terms and a safer handoff', 'Innovation and practical values', 5, true);
  text(s, 'Before confirmation', 72, 208, 430, 42, 25, '#DDEBE0', true);
  bullets(s, ['OTP-verified mobile sign-up', 'Crop, quantity, grade, dates, and location', 'Offers and counteroffers stay in a visible history', 'Mandi price references are labelled as simulated'], 72, 270, 530, 230, 20, '#C6D5CC');
  rule(s, 660, 206, 4, C.yellow, 320);
  text(s, 'After confirmation', 710, 208, 470, 42, 25, '#DDEBE0', true);
  text(s, 'Both participants can see a call button for the other party. The contact is released only after the deal is accepted.', 710, 270, 480, 125, 21, '#C6D5CC');
  text(s, 'Illustrative example from the project README', 710, 444, 490, 27, 14, '#9DB4A5', true);
  text(s, '25 q × ₹2,200/q = ₹55,000\nEstimated 2.5% fee = ₹1,375', 710, 482, 480, 76, 22, C.white, true);
  text(s, 'The example is simulated; it is not a live quote or a charged fee.', 710, 576, 480, 27, 15, '#9DB4A5');
  notes(s, ['Describe OTP verification and the marketplace fields that make terms more explicit.', 'Phone numbers are hidden until deal confirmation. Mandi price data and example commissions in the prototype are simulated; the product is not a payment or legal-contract system.', 'Sources: README.md, OTP setup and prototype disclaimer; src/pages/SignupPage.tsx; src/pages/DashboardPage.tsx; server/src/modules/offers/offers.controller.ts; README.md, Sample Commission Calculation.']);
}

// 6 — Screens
{
  const s = base('The product in the user’s flow', 'Product walkthrough', 6);
  await image(s, path.join(buildDir, 'assets/dashboard.png'), 72, 194, 700, 430, 'Farmer dashboard with deal activity and offer progress');
  await image(s, path.join(buildDir, 'assets/history.png'), 812, 224, 396, 170, 'Buyer profile history screen with active and completed tabs');
  text(s, 'Deal progress', 812, 424, 370, 30, 21, C.ink, true);
  text(s, 'The dashboard brings listings, response needs, volume, and offers together.', 812, 466, 364, 66, 18, C.muted);
  text(s, 'Profile history', 812, 554, 370, 30, 21, C.ink, true);
  text(s, 'Active and completed posts remain visible to the account owner.', 812, 590, 364, 58, 18, C.muted);
  text(s, 'Screenshots show prototype UI; displayed account and deal values are sample data.', 72, 642, 1100, 22, 14, C.muted);
  notes(s, ['Use the screenshots to show the dashboard’s offer status flow and the profile history filters.', 'The screenshots are supplied project screenshots. Any figures visible in them are sample/demo data and must not be presented as actual outcomes.', 'Sources: supplied MandiMatch dashboard and buyer-history screenshots; src/pages/DashboardPage.tsx; src/pages/ProfilePage.tsx.']);
}

// 7 — KPI plan
{
  const s = base('KPIs for a real pilot', 'KPIs and outcomes', 7);
  text(s, 'Track outcomes after real farmers and buyers use the marketplace. No live pilot results are claimed yet.', 72, 194, 1080, 58, 21, C.muted);
  const groups = [
    ['DISCOVERY', 'Active listings and buyer needs', 'Eligible posts that receive a relevant match'],
    ['CONVERSION', 'Offers sent and deals confirmed', 'Offer acceptance rate; median time to confirmation'],
    ['TRADE VALUE', 'Confirmed quintals traded', 'Agreed deal value, reported in ₹'],
    ['TRUST', 'Verified contact coverage', 'Review completion and post-deal feedback'],
  ];
  groups.forEach(([tag, title, detail], i) => {
    const x = i % 2 ? 680 : 72, y = i < 2 ? 310 : 485;
    text(s, tag, x, y, 500, 22, 14, C.bright, true);
    text(s, title, x, y + 35, 510, 34, 23, C.ink, true);
    text(s, detail, x, y + 80, 500, 52, 18, C.muted);
    rule(s, x, y + 149, 500, i === 0 ? C.yellow : C.line, 2);
  });
  text(s, 'Baseline → pilot → compare by role, crop, and district', 72, 638, 1060, 24, 16, C.ink, true);
  notes(s, ['These are proposed KPIs, not reported results. Explain how each one connects to discovery, deal completion, value, or user trust.', 'Sources: project feature set in src/pages/DashboardPage.tsx; src/pages/MatchesPage.tsx; src/pages/ProfilePage.tsx. KPI definitions are proposed for a future pilot.']);
}

// 8 — Feedback and next steps
{
  const s = base('Feedback shaped the next version', 'Education and response to feedback', 8, true);
  text(s, 'Changes made from user feedback', 72, 210, 530, 40, 25, '#DDEBE0', true);
  bullets(s, ['Active and completed profile history', 'Clearer “waiting for your response” offer links', 'Contact buttons after deal confirmation', 'Crop grade and dated listing details'], 72, 272, 520, 208, 20, '#C6D5CC');
  rule(s, 660, 208, 4, C.yellow, 314);
  text(s, 'What I want to learn next', 710, 210, 480, 40, 25, '#DDEBE0', true);
  text(s, '• Can nearby users find a useful match?\n• Which part of negotiation causes delay?\n• What price and transport details are missing?\n• Do users trust the confirmation and contact flow?', 710, 272, 500, 215, 20, '#C6D5CC');
  text(s, 'Next step: run a small farmer–buyer pilot, record the KPIs, and use feedback to prioritize live data and production needs.', 72, 574, 1115, 72, 21, C.white, true);
  notes(s, ['Share the concrete improvements added in response to feedback, then invite your mentor to challenge the pilot plan.', 'Be clear that live mandi feeds, payments, and a production deployment are not claimed as complete.', 'Sources: project history in src/pages/ProfilePage.tsx; src/pages/DashboardPage.tsx; README.md, Prototype Disclaimer and Features Requiring Additional Services for Production.']);
}

await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(buildDir, { recursive: true });
for (const [i, slide] of ppt.slides.items.entries()) {
  const png = await ppt.export({ slide, format: 'png', scale: 1 });
  await fs.writeFile(path.join(buildDir, `slide-${String(i + 1).padStart(2, '0')}.png`), new Uint8Array(await png.arrayBuffer()));
}
const draftPath = path.join(buildDir, 'MandiMatch_draft.pptx');
await (await PresentationFile.exportPptx(ppt)).save(draftPath);
const { finalizePresentation } = await import(pathToFileURL(utilPath).href);
const result = await finalizePresentation({
  workspaceDir: root,
  candidatePath: draftPath,
  finalPath,
  pythonExecutable: 'C:/Users/VIJAY H/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  integrityValidatorPath: 'C:/Users/VIJAY H/.codex/plugins/cache/openai-primary-runtime/presentations/26.1009.11318/skills/presentations/container_tools/inspect_presentation_package_integrity.py',
  layoutValidatorPath: 'C:/Users/VIJAY H/.codex/plugins/cache/openai-primary-runtime/presentations/26.1009.11318/skills/presentations/container_tools/inspect_presentation_layout_geometry.py',
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-bullet-geometry', '--validate-heading-fit'],
  requiredNativeTableOwnerSlides: [],
  fontPolicy: { basis: 'design', families: [FONT] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, 'validation-updated.json'),
});
console.log(JSON.stringify({ finalPath, validation: result }, null, 2));
