/* ============================================================
   Agni & Nil — Counting Game · Screen 1
   Figma: nil-and-agni-count-game · frame 190:495 · canvas 1920 x 1080

   The screen is data-driven: treats and keys are described by the
   coordinate tables below (taken straight from the design) and
   rendered into the fixed 1920x1080 stage.
   ============================================================ */

'use strict';

const DESIGN = { w: 1920, h: 1080 };

/* The tutorial's six treats sit at their exact Figma coordinates. Every later
   stage is laid out by `layoutStage()`, since the design only covers this one. */
const TUTORIAL_TREATS = [
  { cx: 420.5, cy: 347.5, rot: -29.6 },
  { cx: 154.0, cy: 510.5, rot: -42.1 },
  { cx: 773.5, cy: 564.0, rot: -6.8 },
  { cx: 441.5, cy: 640.5, rot: 98.3 },
  { cx: 193.5, cy: 870.0, rot: -26.4 },
  { cx: 650.5, cy: 858.0, rot: -6.8 }
];

/* ============================================================
   Art

   Every treat SVG puts its drawing in the top-left of a larger canvas — the
   extra room is the baked drop shadow. `art` is the side of that drawing, and
   it is what layout measures with; `canvas` is what the <img> is drawn at.

   The packet PNGs already contain their ten treats in a 5 x 2 grid, so a
   group of ten is one image rather than ten elements.
   ============================================================ */
/* Each treat's eyes, so it can blink.

   These faces are bitmaps — every one of these SVGs is a single <rect> filled
   with an embedded PNG, with no vector shapes to target — so a lid cannot just
   hide an eye element. Instead each lid paints *the same artwork*, offset, so
   clean skin from elsewhere on the treat lands over the eye. `dx`/`dy` say
   where that skin comes from, in eye-widths and eye-heights: usually straight
   above or below, but the strawberry has leaves above and runs out of fruit
   below, so it takes its cover from further up.

   Boxes and offsets were measured off 3x renders of each asset (pupils found
   by darkness, then grown into the eye white) and checked by eye, open and
   closed, for all seven. Values are fractions of the drawing's width.
   [x, y, w, h] */
const ART = {
  /* The design's apple: a square PNG, so the drawing box is the canvas.
     Drawn at 280 the fruit itself comes out 205 across, which is what
     the design's render measures. */
  apple:  { file: 'green apple.png', canvas: [1254, 1254], art: 1254, size: 280,
             eyes: { dx: 0, dy: -1.25, l: [0.2489, 0.4327, 0.2136, 0.2589], r: [0.52, 0.4348, 0.2136, 0.2547] } },
  candy:  { file: 'orange candy.svg', canvas: [214, 208], art: 156, size: 217,
             eyes: { dx: 0, dy: 1.25, l: [0.3438, 0.4727, 0.0901, 0.1015], r: [0.5535, 0.4727, 0.0874, 0.1015] } },
  jelly:  { file: 'yellow jelly 12.svg', canvas: [177, 163], art: 123, size: 223,
             eyes: { dx: 0, dy: 1.25, l: [0.2848, 0.3386, 0.1378, 0.1574], r: [0.572, 0.3278, 0.1378, 0.1574] } },
  straw:  { file: 'stoberries.svg', canvas: [214, 208], art: 156, size: 244,
             eyes: { dx: 0, dy: -1.25, l: [0.2802, 0.4482, 0.1961, 0.251], r: [0.5176, 0.4489, 0.1934, 0.2454] } },
  marsh:  { file: 'marsmalo.svg', canvas: [214, 208], art: 156, size: 254,
             eyes: { dx: 0, dy: -1.25, l: [0.2502, 0.4361, 0.262, 0.2753], r: [0.5166, 0.4373, 0.2663, 0.2708] } },
  berry:  { file: 'blue barries.svg', canvas: [215, 208], art: 157, size: 220,
             eyes: { dx: 0, dy: -1.25, l: [0.2504, 0.4821, 0.1764, 0.2003], r: [0.5968, 0.4821, 0.1738, 0.2003] } },
  walnut: { file: 'walnuts.svg', canvas: [214, 208], art: 156, size: 264,
             eyes: { dx: 0, dy: 1.25, l: [0.298, 0.3989, 0.1881, 0.2172], r: [0.5352, 0.4014, 0.1881, 0.2144] } },
};

/* The packets, and where their ten treats sit inside them.

   `grid` is [x, y, w, h] around the 5 x 2 of treats, in the packet's own
   pixels. It lets a single treat inside a flat packet be lit up on its own:
   a cell is drawn as a crop of the very same image, exactly over its treat,
   so at rest it is invisible and when it pops the treat appears to jump out
   of the pack. Measured by finding the treats' pupils (the strawberry's seeds
   are dark too, so that one was measured from the treats instead).

   Without this, counting inside a group — which Transition 1 needs — would
   only work on a group drawn as ten separate treats. */
const PACKETS = {
  jelly:   { file: 'Yellow packet.png', size: [360, 238],
            grid: [39.9, 45.3, 237.2, 90.3] },
  straw:   { file: 'stoberries packet.png', size: [362, 295],
            grid: [26, 62, 255, 124] },
  marsh:   { file: 'marsmalo packet.png', size: [362, 295],
            grid: [29.9, 79.1, 243.8, 96.4] },
  walnut:  { file: 'walnuts packet.png', size: [362, 295],
            grid: [30.5, 59.3, 244.5, 121.0] },
  /* The berries touch each other, so neither pupils nor colour separated them;
     this grid was read off a coordinate overlay of the art. */
  berry:   { file: 'bluberries packet.png', size: [1536, 1024],
            grid: [178, 265, 1184, 507] },
};

/* The play area left of the jar (the jar starts at x 1113). */
const YARD = { x: 40, y: 210, w: 1012, h: 830 };   // stays clear of the jar

/* ============================================================
   The Tutorial Gameplay section of the week-1 script, stage by
   stage. `guided` stages walk the child through with the hand
   nudge; the others are the child's turn, with an inactivity
   nudge and the three-hint ladder.

   `groups` are packs of ten; `loose` are single treats.
   ============================================================ */
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

/* Says a number the way a child counts it: words to twenty, then digits. */
function numWord(n) {
  if (n <= 20) return NUM[n];
  if (n < 100) {
    const tens = Math.floor(n / 10) * 10;
    const ones = n % 10;
    const tensWord = { 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty',
      60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety' }[tens];
    return ones ? tensWord + '-' + NUM[ones] : tensWord;
  }
  return String(n);
}

const STAGES = [
  {
    id: 'tutorial',
    treat: 'apple',
    label: 'Tutorial (6)',
    object: 'berries',
    groups: 0, loose: 6, answer: 6,
    guided: true,
    ost: { main: 'Count the Treats Together', success: 'Jar Closed!' },
    steps: [
      { vo: 'Let us count these treats together.' },
      { countLoose: { from: 1 } },
      { vo: 'We have 6 treats.' },
      { nudgeScreen: true },
      { nudgeKeys: true, vo: 'Now, let us put the magic number on the jar.' }
    ],
    successVo: ['Yay! All packed.']
  },
  {
    id: 'level1',
    treat: 'candy',
    label: 'Level 1 (9)',
    object: 'orange candies',
    groups: 0, loose: 9, answer: 9,
    guided: false,
    ost: { main: 'Count the Treats', success: 'Jar Packed!' },
    steps: [
      { vo: 'It is your turn to pack now! Count first and then write the magic number on the jar.' },
      { awaitTap: true }
    ],
    hints: [
      'Count again.',
      'There are a total of nine treats here.',
      'This is the correct number.'
    ],
    successVo: [
      'Well done! You counted correctly and entered the right number.',
      "That's one more jar packed!"
    ]
  },
  {
    id: 'transition1',
    treat: 'jelly',
    packet: 'jelly',
    label: 'Transition 1 (15)',
    object: 'yellow candies',
    groups: 1, loose: 5, answer: 15,
    guided: true,
    ost: { main: 'Let us Count a Group of 10.', success: 'Well done!' },
    steps: [
      { vo: 'Look! These treats are in a group. Let us count them.' },
      { countGroupItems: { group: 0, from: 1 } },
      { vo: '10 treats. This is a group of 10.', highlightGroups: true },
      { vo: 'Let us see how many treats are there in all.' },
      { countGroupTotal: { group: 0, say: 10 } },
      { countLoose: { from: 11 } },
      { vo: '15 treats.' },
      { nudgeScreen: true },
      { nudgeKeys: true, vo: 'Now, put the magic number on the jar.' }
    ],
    successVo: ['Well done! Now you know how to count in groups of 10.']
  },
  {
    id: 'transition2',
    treat: 'straw',
    packet: 'straw',
    label: 'Transition 2 (27)',
    object: 'strawberries in a box',
    groups: 2, loose: 7, answer: 27,
    guided: true,
    ost: { main: 'Count Two Groups of 10', mid: 'Count Them All', success: 'Keep Going!' },
    steps: [
      { vo: 'Look! We have 2 groups of 10 here.', highlightGroups: true },
      { vo: 'Let us see how many treats are there in all.', ost: 'mid' },
      { countGroupTotal: { group: 0, say: 10 } },
      { countGroupTotal: { group: 1, say: 20 } },
      { countLoose: { from: 21 } },
      { vo: '27 treats.' },
      { nudgeScreen: true },
      { nudgeKeys: true, vo: 'Now, put the magic number on the jar.' }
    ],
    successVo: ['You are all set! Let us count some more.']
  },
  {
    id: 'level2',
    treat: 'marsh',
    packet: 'marsh',
    label: 'Level 2 (42)',
    object: 'marshmallows in packs',
    groups: 4, loose: 2, answer: 42,
    guided: false,
    ost: { main: 'Count all the groups and loose treats.', success: 'Pack the Jars!' },
    steps: [
      { vo: 'It is your turn to pack now! Count all the treats in groups and loose first and then write the magic number on the jar.' },
      { awaitTap: true }
    ],
    hints: [
      'Count again. Count the groups of 10 first, then count the extra treats.',
      'There are 4 groups of 10 and 2 more treats. That makes 42 treats altogether.',
      'This is the correct number.'
    ],
    successVo: ['Yay! Keep packing.']
  },
  {
    id: 'level3',
    treat: 'berry',
    packet: 'berry',
    label: 'Level 3 (50)',
    object: 'berries in packs',
    groups: 5, loose: 0, answer: 50,
    guided: false,
    ost: { main: 'Count all the groups.', success: 'Good job!' },
    steps: [
      { vo: 'Count all the treats in groups and then write the magic number on the jar.' },
      { awaitTap: true }
    ],
    hints: [
      'Count again. Count the groups of 10 first, then count the extra treats.',
      'There are 5 groups of 10 and no loose treats. That makes 50 treats altogether.',
      'This is the correct number.'
    ],
    successVo: ['Good job!']
  },
  {
    id: 'level4',
    treat: 'walnut',
    packet: 'walnut',
    label: 'Level 4 (79)',
    object: 'walnuts in packs',
    groups: 7, loose: 9, answer: 79,
    guided: false,
    ost: { main: 'Count all the groups and loose treats.', success: 'Well done!' },
    steps: [
      { vo: 'Count all the treats in groups and loose first and then write the magic number on the jar.' },
      { awaitTap: true }
    ],
    hints: [
      'Count again. Count the groups of 10 first, then count the extra treats.',
      'There are 7 groups of 10 and 9 more treats. That makes 79 treats altogether.',
      'This is the correct number.'
    ],
    successVo: ['Well done!']
  }
];

const IDLE_NUDGE_MS = 10000;   // the script's inactivity window

/* Keypad hit-area grid. The plates are baked into keypad.png, so each
   key is a transparent rectangle laid over its plate. Centres are taken
   from the plate artwork; the bottom-right cell is the green submit
   button, which has its own exact rect from the design (190:533). */
/* The pad is a clean 3 x 4 grid: 503 x 395 at (1200, 523) divides into cells
   of 167.67 x 98.75, and the design's digits sit on exactly those centres. */
const KEYPAD_RECT = { x: 1200, y: 523, w: 503, h: 395 };
const KEY_W = KEYPAD_RECT.w / 3;
const KEY_H = KEYPAD_RECT.h / 4;
const COL_CENTERS = [0, 1, 2].map((c) => KEYPAD_RECT.x + (c + 0.5) * KEY_W);
const ROW_CENTERS = [0, 1, 2, 3].map((r) => KEYPAD_RECT.y + (r + 0.5) * KEY_H);
/* The submit key keeps the design's own rect rather than the grid cell. */
const SUBMIT_RECT = { x: 1531, y: 820.08, w: 166, h: 97.92 };

/* Key rects below are written in frame coordinates, then re-based onto the
   keypad's own box so the plates and the digits open as one piece. */
const KEYPAD_ORIGIN = { x: KEYPAD_RECT.x, y: KEYPAD_RECT.y };

/* Keys — glyph positions are the exact text coordinates from the
   design (190:519), so the hand-placed offsets are preserved. */
const KEYS = [
  { type: 'digit',  value: '1', label: '1', col: 0, row: 0, gx: 1273, gy: 518 },
  { type: 'digit',  value: '2', label: '2', col: 1, row: 0, gx: 1429, gy: 519 },
  { type: 'digit',  value: '3', label: '3', col: 2, row: 0, gx: 1591, gy: 521 },
  { type: 'digit',  value: '4', label: '4', col: 0, row: 1, gx: 1261, gy: 616 },
  { type: 'digit',  value: '5', label: '5', col: 1, row: 1, gx: 1426, gy: 616 },
  { type: 'digit',  value: '6', label: '6', col: 2, row: 1, gx: 1590, gy: 616 },
  { type: 'digit',  value: '7', label: '7', col: 0, row: 2, gx: 1270, gy: 718 },
  { type: 'digit',  value: '8', label: '8', col: 1, row: 2, gx: 1429, gy: 716 },
  { type: 'digit',  value: '9', label: '9', col: 2, row: 2, gx: 1595, gy: 718 },
  { type: 'clear',  value: 'X', label: 'X', col: 0, row: 3, gx: 1264, gy: 812, light: true },
  { type: 'digit',  value: '0', label: '0', col: 1, row: 3, gx: 1427, gy: 816 },
  { type: 'submit', value: 'ok', label: 'Check answer', col: 2, row: 3 }
];

const MAX_DIGITS = 2;

/* The answer panel's lift is 520 ms; the pad starts opening partway up so
   the two moves read as one gesture. */
const PAD_OPEN_AFTER_LIFT = 260;

/* Where the treats go once the answer is right. The mouth was measured off
   Jar.png — its opening is centred on (1454, 287) and the neck is 507 px
   across — and the pile is a pyramid on the jar's floor. */
const JAR_GATE = { x: 1469, y: 30 };     // well above the jar — they fall from height
const JAR_MOUTH = { x: 1469, y: 288 };   // the opening itself

/* Where they come to rest: a 3 + 2 + 1 heap on the jar's floor, every slot
   jittered so no two wins stack identically.

   Slots rather than rejection sampling on purpose. Scattering at random and
   rejecting spots that are too close cannot always place six treats this size
   in a region this narrow, and the fallback then dropped several onto the same
   point — a heap that looked like three berries instead of six.

   `floorY` is the floor contact line (994) minus the landed radius, so the
   bottom row rests on the glass; change the landed scale and it moves with it.
   The region stays narrower than the jar's floor, so there is clear glass
   either side and six treats read as being *in* a big jar, not filling it. */
/* Middle of the jar, used when a key's rect cannot be read. */
const JAR_CENTRE_X = 1469;
const LAND_SCALE = { min: 0.82, range: 0.08 };

const TREAT_CENTRE = { x: 78.5, y: 78 };  // the berry's centre in its 215 x 208 box

const WIN = {
  holdAt: 480,        // let the green number register
  clearAt: 480,       // board starts fading
  flyAt: 800,         // first treat lifts off
  flyStagger: 150,
  flyDur: 950,
  lidAfter: 260,      // pause after the last treat lands, then the lid
  sparkleAfter: 520   // the cap settles, then the sparkle and the closing line
};

/* Intro sequence (190:507): Agni flies in from the left, the instruction
   plate unrolls behind him, then the copy types itself out. */
const INTRO = {
  flyIn: 1200,        // Agni's flight
  panelAt: 1150,      // plate starts opening just as he settles
  landAt: 1250,       // flight cross-fades into the standing pose
  typeAt: 1520,       // first character
  typeStep: 45,       // ms per character
  treatsAfter: 120,   // pause after the line finishes, then the treats pop
  treatStagger: 70
};

/* On-screen text, from the script's OST column. Not the same thing as the
   voice-over: these are written in the panel, the VO lines never are. */
const OST = {
  main: 'Count the Treats Together',
  done: 'Jar Closed!',           // correct-feedback row
  retry: 'Count/Try Again!'      // incorrect-feedback row
};

/* Voice-over: spoken by Agni, never written on screen. */
const SCRIPT = {
  count: 'Let us count these treats together.',
  total: 'We have 6 treats.',
  magic: 'Now, let us put the magic number on the jar.',
  done: 'Yay! All packed.'
};

/* Sound effects. Kenney's Interface Sounds and Impact Sounds, both CC0
   (public domain) — see Assets/sfx/LICENSE.txt. */
const SFX = {
  enabled: true,
  volume: 0.5,
  dir: 'Assets/sfx/',
  files: {
    panelOpen: 'panel-open.ogg',
    count: 'count.ogg',
    tap: 'tap.ogg',
    padOpen: 'pad-open.ogg',
    key: 'key.ogg',
    correct: 'correct.ogg',
    wrong: 'wrong.ogg',
    berryFly: 'berry-fly.ogg',
    berryLand: 'berry-land.ogg',
    capClose: 'cap-close.ogg',
    win: 'win.ogg',           // pizzicato: playful and a bit spooky, not scary
    stage: 'stage.ogg',       // a shorter jingle as a new stage arrives
    capSeal: 'cap-seal.ogg',  // the little shine after the lid lands
    coins: 'coins.ogg',       // a reward rattle over a right answer
    creak: 'creak.ogg',       // spooky house flavour, used sparingly
    pan: 'pan.ogg'            // the camera moving to the next jar
  },
  /* Per-cue level, because the packs are not mixed to each other. */
  gain: {
    count: 0.55, tap: 0.4, key: 0.5, padOpen: 0.45, panelOpen: 0.5,
    correct: 0.5, wrong: 0.4, berryFly: 0.3, berryLand: 0.4, capClose: 0.9,
    win: 0.62, stage: 0.42, capSeal: 0.55, coins: 0.5, creak: 0.3, pan: 0.45
  }
};

/* Agni's voice. There are no recorded lines, so he speaks through the
   browser's own speech synthesis — no assets, works offline. If recorded
   audio arrives later, listen for the `vo` event instead and set
   `VO.enabled = false`.

   Tuned for the character: a small, friendly dragon, so the pitch is well up
   and the pace is easy for a young listener. */
const VO = {
  enabled: 'speechSynthesis' in window,
  muted: false,
  /* Agni is a small girl dragon. Browser speech has no child voice, so this
     is the whole toolkit: the highest pitch the API allows, a slightly brisk
     rate (an adult voice pitched up but read slowly sounds processed; pitched
     up and a little quicker reads younger), and a female voice guaranteed.
     It gets close to a young girl. It is not one — that needs recorded lines. */
  rate: 1.02,
  pitch: 2,
  volume: 1,
  /* en-IN first: this is where the game is used. */
  langPrefs: ['en-IN', 'en-GB', 'en-AU', 'en-US', 'en'],
  /* Lighter, younger-sounding voices first, matched against the voice name.
     Heera leads because the accent suits the children playing this. */
  namePrefs: ['heera', 'neerja', 'swara', 'zira', 'aria', 'jenny', 'eva',
              'samantha', 'female', 'google'],
  /* Never Agni: these are the male voices Windows and Android ship. Without
     this the "first voice in the right language" fallback picks Ravi on an
     Indian English system, and Agni comes out as a man. */
  avoid: ['david', 'mark', 'ravi', 'hemant', 'george', 'james', 'guy',
          'george', 'liam', 'male'],
  /* Roughly how long a character takes to speak at the rate above. Used to
     pace the typing when the browser gives no word-boundary events. */
  charMs: 82,
  /* Spoken as words so the counting is clear. */
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
};

const FLOW = {
  afterPanel: 260,      // pause once the plate is open, then the on-screen text
  afterOst: 340,        // then Agni starts talking
  countStart: 620,      // beat before the counting begins
  countStep: 720,       // one treat per step, when there is no voice to follow
  countGap: 260,        // breath between spoken numbers
  afterCount: 520,      // pause before "We have 6 treats."
  beforeNudge: 900,     // then the hand comes in
  handSettle: 620,      // it travels, then taps
  afterTap: 480,        // pad opens, then the next line
  beforeKeyNudge: 700,  // then the hand moves to the key
  autoSubmit: 520,      // after the child taps, the answer is checked
  beforeWin: 700,       // beat after the answer lands, then the treats fly
  beforeNextStage: 900  // the closing line finishes, then the next stage
};

const stage = document.getElementById('stage');
const world = document.getElementById('world');
const treatsLayer = document.getElementById('treats');
const keysLayer = document.getElementById('keys');
const displayValue = document.getElementById('displayValue');
const agni = document.getElementById('agni');
const agniStand = document.getElementById('agniStand');
const keypadPlates = document.querySelector('.keypad');
const displayPanel = document.querySelector('.display');
const answerPanel = document.getElementById('answer');
const hand = document.getElementById('hand');
const jarLid = document.getElementById('jarLid');
const sparkles = document.getElementById('sparkles');
const displayHit = document.getElementById('displayHit');
const panelPlate = document.getElementById('panelPlate');
const panelText = document.getElementById('panelText');
const panelTyped = document.getElementById('panelTyped');
const panelCaret = document.getElementById('panelCaret');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  gen: 0,            // bumped on every stage change; stale callbacks check it
  stageIndex: 0,
  items: [],         // what is on the yard: packs and loose treats
  entry: '',
  answer: 0,
  wrong: 0,          // wrong attempts on this stage, for the hint ladder
  expect: null,      // guided digits, when the hand is walking the answer
  allowed: null,     // when set, only these keys respond
  idleTimer: null,
  locked: false
};

/* ------------------------------------------------------------
   Stage scaling — keep the 1920x1080 canvas whole, letterboxed
   ------------------------------------------------------------ */
function fitStage() {
  const scale = Math.min(
    window.innerWidth / DESIGN.w,
    window.innerHeight / DESIGN.h
  );
  stage.style.setProperty('--scale', scale);
}

/* ------------------------------------------------------------
   Build the scene
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   Laying out a stage

   The design only covers the tutorial's six scattered treats, so those keep
   their exact Figma coordinates. Everything else is placed here: packs of ten
   in a row across the yard, loose treats in a block beside them. The treat
   size falls out of how many packs must fit, so seven packs and nine loose
   still sit inside the yard without reaching the jar.

   Positions are the **centre** of the berry, not its box. `.treat` scales
   about that centre, so a scaled treat stays put and the layout maths does
   not have to know the scale.
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   Laying out a stage

   The tutorial's six treats keep their exact Figma coordinates, scaled so a
   green apple fills the same slot the design drew a berry in. Everything else
   is placed here: groups of ten down the yard ("organised vertically", says
   the script), loose treats in a block beside them.

   Positions are the CENTRE of the drawing. `.treat` and `.pack` both scale
   about their centre, so a scaled thing stays where it was put and the layout
   maths never has to know the scale.
   ------------------------------------------------------------ */
/* Generous, because spacing is now the only thing that says "these ten are a
   group" — the ring around a pack is gone, and Level 3 has no packet art, so
   without real gaps its five groups read as one block of fifty berries. */
const PACK_GAP = { x: 46, y: 38 };
const PACK_ROWS_MAX = 4;
/* Caps, so one or two groups do not balloon to fill the whole yard. */
const PACK_MAX = { w: 520, h: 340 };
/* Every packet is this shape; a group drawn as ten singles uses it too, so a
   grouped ten and a packed ten read as the same kind of thing. */
const PACK_ASPECT = 362 / 295;

/* A group of ten with no packet art: the same 5 x 2 the packets use. */
const GROUP_COLS = 5;
const GROUP_ROWS = 2;

/* Picks how to arrange g groups in the yard.

   The script wants them "organised vertically", so this fills columns
   downwards — but *how many* rows is chosen by trying each option and
   keeping whichever makes the groups biggest. One column of four packs
   leaves most of the yard empty and shrinks every treat with it. */
function packGrid(g, aspect, share, gap) {
  let best = null;
  for (let rows = 1; rows <= PACK_ROWS_MAX; rows += 1) {
    const cols = Math.ceil(g / rows);
    let h = (YARD.h - (rows - 1) * gap.y) / rows;
    let w = h * aspect;

    const maxW = (YARD.w * share - (cols - 1) * gap.x) / cols;
    if (w > maxW) { w = maxW; h = w / aspect; }
    if (w > PACK_MAX.w) { w = PACK_MAX.w; h = w / aspect; }
    if (h > PACK_MAX.h) { h = PACK_MAX.h; w = h * aspect; }

    // Ties go to the taller arrangement — more vertical, as the script asks.
    if (!best || w * h > best.w * best.h + 1) best = { rows, cols, w, h, gap };
  }
  return best;
}

function stageArt(stage) {
  return ART[stage.treat] || ART.berry;
}

function layoutStage(stage) {
  const items = [];
  const art = stageArt(stage);

  if (stage.id === 'tutorial') {
    /* The design places these six by hand — centre and tilt each — and draws
       them at the treat's own size. */
    const scale = art.size / art.art;
    TUTORIAL_TREATS.forEach((t) => items.push({
      kind: 'loose', cx: t.cx, cy: t.cy, rot: t.rot, scale
    }));
    return items;
  }

  const g = stage.groups;
  let packW = 0, packH = 0, packCols = 0, packRows = 0, innerArt = 0;
  let packGap = PACK_GAP;

  if (g > 0) {
    const packet = stage.packet ? PACKETS[stage.packet] : null;
    const aspect = packet ? packet.size[0] / packet.size[1] : PACK_ASPECT;
    /* How much of the yard the groups may take: all of it when there are no
       loose treats to place, less when a block of them needs room. */
    const share = stage.loose === 0 ? 0.9 : (stage.loose <= 3 ? 0.66 : 0.56);
    /* A group with no packet art has nothing holding it together, so it needs
       a far bigger gap than a packet does before ten treats read as one
       group. Level 3 without this is fifty identical berries in a grid. */
    const gap = stage.packet ? PACK_GAP : { x: 96, y: 66 };
    const grid = packGrid(g, aspect, share, gap);
    packRows = grid.rows;
    packCols = grid.cols;
    packGap = grid.gap;
    packW = grid.w;
    packH = grid.h;

    // The treats drawn inside a packet are about a fifth of its width.
    innerArt = packW * 0.17;

    const blockH = packRows * packH + (packRows - 1) * packGap.y;
    const blockTop = YARD.y + (YARD.h - blockH) / 2;

    for (let i = 0; i < g; i += 1) {
      const col = Math.floor(i / packRows);          // fill downwards first
      const row = i % packRows;
      const item = {
        kind: 'pack',
        x: YARD.x + col * (packW + packGap.x),
        y: blockTop + row * (packH + packGap.y),
        w: packW, h: packH,
        packet: stage.packet || null
      };

      if (!stage.packet) {
        // Ten singles, arranged the way the packet art would have them.
        const cellW = packW / GROUP_COLS;
        const cellH = packH / GROUP_ROWS;
        item.scale = (Math.min(cellW, cellH) * 0.92) / art.art;
        item.members = [];
        for (let k = 0; k < 10; k += 1) {
          item.members.push({
            cx: (k % GROUP_COLS) * cellW + cellW / 2,
            cy: Math.floor(k / GROUP_COLS) * cellH + cellH / 2
          });
        }
      }
      items.push(item);
    }
    if (!stage.packet) innerArt = items[0].scale * art.art;
  }

  if (stage.loose > 0) {
    /* Loose treats are drawn at the object's own size — these are the things
       a five-year-old counts one by one, so they stay big and only shrink if
       they genuinely will not fit beside the groups. */
    const zoneLeft = g > 0
      ? YARD.x + packCols * packW + (packCols - 1) * packGap.x + 34
      : YARD.x;
    const room = YARD.x + YARD.w - zoneLeft;

    let looseArt = art.size;
    let perRow = 0;
    let rows = 0;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const gapStep = looseArt * 1.16;
      perRow = Math.max(1, Math.floor(room / gapStep));
      rows = Math.ceil(stage.loose / perRow);
      if (rows * gapStep <= YARD.h && perRow * gapStep <= room) break;
      looseArt *= 0.9;                    // too tall or too wide: come down
    }

    const scale = looseArt / art.art;
    const step = looseArt * 1.16;
    const blockW = Math.min(perRow, stage.loose) * step;
    const left = zoneLeft + (room - blockW) / 2;
    const top = YARD.y + (YARD.h - rows * step) / 2;

    for (let i = 0; i < stage.loose; i += 1) {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const jx = ((i * 37) % 15) - 7;                // deterministic jitter
      const jy = ((i * 53) % 13) - 6;
      items.push({
        kind: 'loose',
        cx: left + col * step + step / 2 + jx,
        cy: top + row * step + step / 2 + jy,
        scale
      });
    }
  }
  return items;
}

/* ------------------------------------------------------------
   Rendering treats and packs
   ------------------------------------------------------------ */
function treatEl(art, scale, i) {
  const el = document.createElement('div');
  el.className = 'treat';
  el.style.setProperty('--tw', art.canvas[0] + 'px');
  el.style.setProperty('--th', art.canvas[1] + 'px');
  el.style.setProperty('--ta', art.art + 'px');
  el.style.setProperty('--treat-scale', scale);
  el.style.setProperty('--idle-dur', (3200 + i * 170) + 'ms');
  el.style.setProperty('--idle-delay', (i * 330) + 'ms');

  const body = document.createElement('div');
  body.className = 'treat__body';

  const img = document.createElement('img');
  img.src = 'Assets/' + art.file;
  img.alt = '';
  body.appendChild(img);

  /* Two eyelids, each a patch of the treat's own skin copied over its eye. */
  if (art.eyes) {
    el.style.setProperty('--blink-dur', (3900 + i * 260) + 'ms');
    el.style.setProperty('--blink-delay', (i * 690) + 'ms');
    ['l', 'r'].forEach((side) => {
      const box = art.eyes[side];
      const ex = box[0] * art.art;
      const ey = box[1] * art.art;
      const ew = box[2] * art.art;
      const eh = box[3] * art.art;
      const sx = -ew * art.eyes.dx;
      const sy = -eh * art.eyes.dy;
      const lid = document.createElement('span');
      lid.className = 'treat__lid';
      lid.style.cssText =
        'left:' + ex + 'px;top:' + ey + 'px;width:' + ew + 'px;height:' + eh + 'px;' +
        'border-bottom-width:' + Math.max(2, eh * 0.13).toFixed(1) + 'px;' +
        'background-image:url("Assets/' + art.file + '");' +
        'background-size:' + art.canvas[0] + 'px ' + art.canvas[1] + 'px;' +
        'background-position:' + -(ex - sx) + 'px ' + -(ey - sy) + 'px';
      body.appendChild(lid);
    });
  }

  el.appendChild(body);
  return el;
}

/* Places a treat by the centre of its drawing. */
function placeTreat(el, art, cx, cy) {
  el.style.left = (cx - art.art / 2) + 'px';
  el.style.top = (cy - art.art / 2) + 'px';
}

function renderStage(stage) {
  treatsLayer.innerHTML = '';
  treatsLayer.classList.remove('treats--in-jar');
  const art = stageArt(stage);
  state.items = layoutStage(stage);

  state.items.forEach((item, i) => {
    if (item.kind === 'loose') {
      const el = treatEl(art, item.scale, i);
      el.classList.add('treat--waiting');
      if (item.rot) el.style.setProperty('--treat-rot', item.rot + 'deg');
      placeTreat(el, art, item.cx, item.cy);
      item.el = el;
      treatsLayer.appendChild(el);
      return;
    }

    /* A group of ten is one element either way, so it can glow, fly and land
       as a single thing — which is what the script needs a group to do. */
    const pack = document.createElement('div');
    pack.className = 'pack pack--waiting' + (item.packet ? ' pack--packet' : '');
    pack.style.left = item.x + 'px';
    pack.style.top = item.y + 'px';
    pack.style.width = item.w + 'px';
    pack.style.height = item.h + 'px';

    if (item.packet) {
      const packet = PACKETS[item.packet];
      const img = document.createElement('img');
      img.className = 'pack__art';
      img.src = 'Assets/' + packet.file;
      img.alt = '';
      pack.appendChild(img);

      /* Ten cells, each a crop of this same packet over one of its treats.
         Invisible at rest; pops when its number is counted. */
      const k = item.w / packet.size[0];
      const [gx, gy, gw, gh] = packet.grid;
      const cw = (gw / 5) * k;
      const chh = (gh / 2) * k;
      item.members = [];
      for (let n = 0; n < 10; n += 1) {
        const cx = (gx + (n % 5) * (gw / 5)) * k;
        const cy = (gy + Math.floor(n / 5) * (gh / 2)) * k;
        const cell = document.createElement('span');
        cell.className = 'pack__cell';
        cell.style.cssText =
          'left:' + cx + 'px;top:' + cy + 'px;' +
          'width:' + cw + 'px;height:' + chh + 'px;' +
          'background-image:url("Assets/' + packet.file + '");' +
          'background-size:' + (packet.size[0] * k) + 'px ' + (packet.size[1] * k) + 'px;' +
          'background-position:' + -cx + 'px ' + -cy + 'px';
        item.members.push({ el: cell });
        pack.appendChild(cell);
      }
    } else {
      item.members.forEach((m, k) => {
        const el = treatEl(art, item.scale, k);
        placeTreat(el, art, m.cx, m.cy);
        m.el = el;
        pack.appendChild(el);
      });
    }

    item.el = pack;
    treatsLayer.appendChild(pack);
  });
}

/* Every treat on the yard, packs unpacked — for counting and for the flight. */
function allTreats() {
  const out = [];
  state.items.forEach((item) => {
    if (item.kind === 'loose') out.push(item.el);
    else if (item.members) item.members.forEach((m) => out.push(m.el));
    else out.push(item.el);        // a packet: the group is the thing
  });
  return out;
}

function looseItems() {
  return state.items.filter((it) => it.kind === 'loose');
}

function packItems() {
  return state.items.filter((it) => it.kind === 'pack');
}

/* Staggered pop-in across the yard. */
function revealTreats() {
  state.items.forEach((item, i) => {
    const el = item.el;
    setTimeout(() => {
      el.classList.remove('treat--waiting', 'pack--waiting');
      el.classList.add(item.kind === 'pack' ? 'pack--in' : 'treat--in');
      el.addEventListener('animationend', () => {
        el.classList.remove('treat--in', 'pack--in');
        if (item.kind === 'loose') el.classList.add('treat--idle');
        else if (item.members) item.members.forEach((m) => m.el.classList.add('treat--idle'));
      }, { once: true });
    }, i * INTRO.treatStagger);
  });
}

function renderKeys() {
  keysLayer.innerHTML = '';
  KEYS.forEach((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'key key--' + key.type;
    btn.dataset.type = key.type;
    btn.dataset.value = key.value;
    btn.setAttribute('aria-label', key.type === 'clear' ? 'Delete last digit' : key.label);

    const rect = key.type === 'submit' ? SUBMIT_RECT : {
      x: COL_CENTERS[key.col] - KEY_W / 2,
      y: ROW_CENTERS[key.row] - KEY_H / 2,
      w: KEY_W,
      h: KEY_H
    };
    btn.style.setProperty('--kx', rect.x - KEYPAD_ORIGIN.x);
    btn.style.setProperty('--ky', rect.y - KEYPAD_ORIGIN.y);
    btn.style.setProperty('--kw', rect.w);
    btn.style.setProperty('--kh', rect.h);

    if (key.type === 'submit') {
      btn.innerHTML =
        '<div class="submit__plate"><img src="Assets/green-button.png" alt="" /></div>' +
        '<div class="submit__tick"><div class="submit__tick-inner">' +
        '<img src="Assets/tick.svg" alt="" /></div></div>';
    } else {
      const glyph = document.createElement('span');
      glyph.className = 'key__glyph' + (key.light ? ' key__glyph--light' : '');
      glyph.style.setProperty('--gx', key.gx - rect.x);
      glyph.style.setProperty('--gy', key.gy - rect.y);
      glyph.textContent = key.label;
      btn.appendChild(glyph);
    }

    keysLayer.appendChild(btn);
  });
}

/* ------------------------------------------------------------
   Answer entry
   ------------------------------------------------------------ */
function paintDisplay() {
  displayValue.textContent = state.entry;
}

function clearFeedback() {
  displayValue.classList.remove('display__value--ok', 'display__value--bad');
}

function pressDigit(digit) {
  if (state.locked) return;
  if (state.allowed && !state.allowed.includes(digit)) return;
  clearFeedback();
  if (state.entry.length >= MAX_DIGITS) return;
  if (state.entry === '' && digit === '0') return;   // no leading zero
  state.entry += digit;
  paintDisplay();
  playSfx('key');

  /* Nothing is judged here. The child types, looks at what they typed, fixes
     it with the delete key if they want, and presses the tick when ready. */
  if (state.expect) {
    const want = String(state.answer);
    if (state.entry.length < want.length) {
      pointAtExpected();            // guided: on to the next digit
    } else {
      pointAtSubmit();              // guided: now press the tick
    }
  }
}

/* Guided stages send the hand to the tick once the number is complete, and
   let only the tick respond — so "press this to check" is taught, not assumed. */
function pointAtSubmit() {
  restrictKeys(['ok']);
  const c = keyCentre('ok');
  handPointAt(c.x, c.y);
}

function pressClear() {
  if (state.locked) return;
  clearFeedback();
  state.entry = state.entry.slice(0, -1);
  paintDisplay();
  // A guided stage points at the digit that is now due again.
  if (state.expect) {
    if (state.entry.length < String(state.answer).length) pointAtExpected();
    else pointAtSubmit();
  }
}

function pressSubmit() {
  if (state.locked || state.entry === '') return;

  handHide();
  restrictKeys([]);                 // hands off while it is being judged
  const correct = Number(state.entry) === state.answer;
  state.locked = true;
  keysLayer.classList.add('is-locked');
  clearFeedback();

  if (correct) {
    displayValue.classList.add('display__value--ok');
    playSfx('correct');
    setTimeout(() => playSfx('coins'), 180);
    handHide();
    clearIdleTimer();
    clearGlows();
    // Stays locked: the round is over, the treats go home.
    setTimeout(playWin, FLOW.beforeWin);
  } else {
    // "The spooky treats wiggle." — and the panel asks for another go.
    displayValue.classList.add('display__value--bad');
    playSfx('wrong');
    treatsLayer.querySelectorAll('.treat').forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('treat--wiggle');
        el.addEventListener('animationend', () => el.classList.remove('treat--wiggle'), { once: true });
      }, i * 55);
    });
    showOst('Count/Try Again!');
    state.wrong += 1;
    setTimeout(() => {
      state.entry = '';
      paintDisplay();
      clearFeedback();
      showOst(currentStage().ost.main);
      state.locked = false;
      keysLayer.classList.remove('is-locked');

      /* Judging the answer disables every key (`restrictKeys([])`), so they
         have to be handed back before the next try — otherwise one wrong
         answer leaves the pad dead. A guided stage goes back to pointing at
         the digit it is due; the child's turn gets the whole pad again. */
      if (state.expect) pointAtExpected();   // guided: back to the first digit
      else restrictKeys(null);                // the child's turn: whole pad

      giveHint();                       // the script's three-step ladder
    }, 1400);
  }
}

/* Sparkle on the closed jar. Points are spread over the glass, each a beat
   after the last, so it reads as a twinkle rather than a flash. */
const SPARKLE_POINTS = [
  { x: 120, y: 210 }, { x: 470, y: 160 }, { x: 610, y: 330 },
  { x: 90, y: 520 }, { x: 350, y: 690 }, { x: 585, y: 610 },
  { x: 240, y: 380 }, { x: 520, y: 800 }
];

function sparkle() {
  sparkles.innerHTML = '';
  SPARKLE_POINTS.forEach((p, i) => {
    const dot = document.createElement('span');
    dot.className = 'sparkle';
    dot.style.left = p.x + 'px';
    dot.style.top = p.y + 'px';
    dot.style.animationDelay = (i * 110) + 'ms';
    sparkles.appendChild(dot);
  });
  sparkles.classList.add('sparkles--on');
}

/* ------------------------------------------------------------
   Right answer: clear the board, fly every treat into the jar,
   then drop the lid on.
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   Everything flies into the jar.

   Packs travel as one thing and land in a row along the floor; loose treats
   land in a heap. With no packs (the tutorial) the heap keeps its verified
   3 + 2 + 1 arrangement on the glass. The jar's inside is 1160..1750 wide.
   ------------------------------------------------------------ */
/* Scaled with the jar: 650 x 835 at (1144, 192) now, down from
   697 x 895 at (1113, 184). */
const JAR_INSIDE = { left: 1225, right: 1701, top: 397, floorY: 923 };

/* Total area of everything that lands, as a multiple of the jar's inside.
   Above 1 because a heap overlaps — that is what lets the treats be drawn big
   enough to see while the jar still looks 50-70% full. Packing them into a
   grid that had to fit inside 1.0 was what made everything so small. */
const JAR_PILE_AREA = 1.25;

/* How high the heap is allowed to build, as a share of the jar's inside. */
const JAR_PILE_HEIGHT = 0.62;

/* One scale for everything that lands, from the area budget above. Never
   larger than the item was on the table — treats do not grow on the way in. */
function jarScale(items) {
  const iw = JAR_INSIDE.right - JAR_INSIDE.left - 18;
  const ih = JAR_INSIDE.floorY - JAR_INSIDE.top;
  const total = items.reduce((sum, it) => sum + it.w * it.h, 0);
  if (!total) return 1;
  const byArea = Math.sqrt((JAR_PILE_AREA * iw * ih) / total);
  // Nothing wider than about half the jar, or one pack fills the whole view.
  const widest = Math.max.apply(null, items.map((it) => it.w));
  return Math.min(1, byArea, (iw * 0.56) / widest);
}

/* Where each thing comes to rest.

   Random across the width, building upward from the floor in the order they
   fly, with its own tilt — so it reads as things dropped into a jar and
   settling on each other, rather than laid out in rows. */
function scatterInJar(items, scale) {
  const iw = JAR_INSIDE.right - JAR_INSIDE.left - 18;
  const ih = JAR_INSIDE.floorY - JAR_INSIDE.top;
  const cx = (JAR_INSIDE.left + JAR_INSIDE.right) / 2;
  const last = Math.max(1, items.length - 1);

  /* How high the heap needs to build follows the contents, not the jar. Given
     every stage the same height, six apples spread themselves up the middle of
     the jar instead of sitting in a pile on the floor. */
  const avgW = items.reduce((n, it) => n + it.w, 0) / items.length * scale;
  const avgH = items.reduce((n, it) => n + it.h, 0) / items.length * scale;
  const perRow = Math.max(1, Math.floor(iw / (avgW * 0.82)));
  const rows = Math.ceil(items.length / perRow);
  const pileH = Math.min(ih * JAR_PILE_HEIGHT, rows * avgH * 0.6);
  // A small heap keeps to the middle rather than spanning the whole jar.
  const spread = Math.min(iw - avgW, perRow * avgW * 0.92);

  return items.map((it, i) => {
    const h = it.h * scale;
    const climb = (i / last) * pileH * 0.86 + Math.random() * pileH * 0.14;
    return {
      x: cx + (Math.random() * 2 - 1) * spread * 0.5,
      y: JAR_INSIDE.floorY - h / 2 - climb,
      // Packs are flatter, so they tolerate less tilt than a single treat.
      spin: (Math.random() * 2 - 1) * (it.kind === 'pack' ? 20 : 32)
    };
  });
}

function flyOne(el, from, target, landScale, i, spin) {
  const set = (name, value) => el.style.setProperty(name, value + 'px');
  const gateX = JAR_GATE.x + (Math.random() * 2 - 1) * 60;

  set('--gx', gateX - from.x);       set('--gy', JAR_GATE.y - from.y);
  set('--mx', JAR_MOUTH.x - from.x); set('--my', JAR_MOUTH.y - from.y);
  set('--tx', target.x - from.x);    set('--ty', target.y - from.y);
  el.style.setProperty('--spin',
    (spin === undefined ? (Math.random() * 2 - 1) * 11 : spin).toFixed(1) + 'deg');
  el.style.setProperty('--land', landScale.toFixed(3));
  el.style.setProperty('--fly-delay', (i * WIN.flyStagger) + 'ms');

  const delay = i * WIN.flyStagger;
  setTimeout(() => playSfx('berryFly', 0.9 + Math.random() * 0.25), delay);
  setTimeout(() => playSfx('berryLand', 0.9 + Math.random() * 0.3),
             delay + WIN.flyDur * 0.9);
}

function flyTreatsIntoJar() {
  const art = stageArt(currentStage());
  const packs = packItems();
  const loose = looseItems();

  // The rings were for teaching. Inside the jar they are just clutter.
  packs.forEach((p) => p.el.classList.remove('pack--marked', 'pack--glow'));

  /* Packs go in first and settle at the bottom, loose treats after them, so
     the heap builds the way it would if you tipped them in. */
  const items = packs.map((p) => ({
    kind: 'pack', el: p.el, pack: p,
    from: { x: p.x + p.w / 2, y: p.y + p.h / 2 },
    w: p.w, h: p.h
  })).concat(loose.map((it) => ({
    kind: 'loose', el: it.el,
    from: { x: it.cx, y: it.cy },
    w: art.size, h: art.size
  })));

  if (!items.length) return WIN.flyDur;

  const scale = jarScale(items);
  const rest = scatterInJar(items, scale);

  items.forEach((item, i) => {
    const to = rest[i];
    if (item.pack && item.pack.members) {
      item.pack.members.forEach((m) => m.el.classList.remove('treat--idle'));
    }
    item.el.classList.remove('treat--idle');

    // `treat-fly` ends on --spin x 1.7, so aim it at the tilt we want.
    flyOne(item.el, item.from, to,
           item.kind === 'pack' ? scale : (art.size * scale) / art.art,
           i, to.spin / 1.7);
    item.el.classList.add(item.kind === 'pack' ? 'pack--fly' : 'treat--fly');
    item.el.style.zIndex = Math.round(to.y);   // nearer the front, drawn on top
  });

  /* How full the jar came out, as a share of its inside — reported rather
     than eyeballed. Overlap means this can read above the visible fill. */
  const iw = JAR_INSIDE.right - JAR_INSIDE.left - 18;
  const ih = JAR_INSIDE.floorY - JAR_INSIDE.top;
  state.jarFill = items.reduce((sum, it) => sum + it.w * it.h, 0)
    * scale * scale / (iw * ih);
  state.jarScale = scale;

  return Math.max(0, items.length - 1) * WIN.flyStagger + WIN.flyDur;
}

function sealJar() {
  jarLid.classList.add('jar-lid--on');
  /* The cap meets the glass partway through its drop, not at the start —
     a wooden knock as it lands, then a small shine as it seals. */
  setTimeout(() => playSfx('capClose'), 330);
  setTimeout(() => playSfx('capSeal'), 520);
}

function giggleTreats() {
  allTreats().forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('treat--giggle');
      el.addEventListener('animationend', () => el.classList.remove('treat--giggle'), { once: true });
    }, i * 70);
  });
}

function playWin() {
  // "The spooky treats giggle and fly inside the jar."
  giggleTreats();
  setTimeout(() => stage.classList.add('stage--clearing'), WIN.clearAt);
  setTimeout(() => {
    const flightMs = flyTreatsIntoJar();
    setTimeout(() => treatsLayer.classList.add('treats--in-jar'), flightMs);
    setTimeout(() => {
      sealJar();
      setTimeout(() => {
        // "The lid closes." Then the jar sparkles, the panel comes back with
        // the closing text, and Agni says the stage's closing line.
        sparkle();
        playSfx('win');
        stage.classList.add('stage--closing');
        showOst(currentStage().ost.success);
        sayAll(currentStage().successVo, () => {
          setTimeout(nextStage, FLOW.beforeNextStage);
        });
        stage.dispatchEvent(new CustomEvent('roundcomplete', {
          detail: { stage: currentStage().id, answer: state.answer }
        }));
      }, WIN.sparkleAfter);
    }, flightMs + WIN.lidAfter);
  }, WIN.flyAt);
}

function handleKey(type, value) {
  if (type === 'digit') pressDigit(value);
  else if (type === 'clear') pressClear();
  else if (type === 'submit') pressSubmit();
}

/* ------------------------------------------------------------
   Intro: Agni flies in -> plate opens -> copy types -> treats land
   ------------------------------------------------------------ */
/* Counting climbs a major scale rather than stepping up by a flat
   percentage — ten counts in a row want to sound like music, not like a
   siren. Semitones from the root, then it repeats an octave higher, so any
   count from 1 to 27 keeps working. */
const SCALE = [0, 2, 4, 5, 7, 9, 11, 12];

function countRate(n) {
  const i = Math.max(0, n - 1);
  const semis = SCALE[i % SCALE.length] + 12 * Math.floor(i / SCALE.length);
  return Math.pow(2, semis / 12);
}

/* ------------------------------------------------------------
   Sound effects
   ------------------------------------------------------------ */
const sfxBank = {};

function loadSfx() {
  if (!SFX.enabled) return;
  Object.entries(SFX.files).forEach(([name, file]) => {
    const audio = new Audio(SFX.dir + file);
    audio.preload = 'auto';
    sfxBank[name] = audio;
  });
}

/* `rate` shifts the pitch as well as the speed — `preservesPitch = false` is
   what allows the counting cue to climb a step per treat. */
function playSfx(name, rate) {
  if (!SFX.enabled) return;
  const master = sfxBank[name];
  if (!master) return;
  // A fresh node per play, so overlapping cues don't cut each other off.
  const node = master.cloneNode();
  node.volume = SFX.volume * (SFX.gain[name] || 1);
  if (rate) {
    node.preservesPitch = false;
    node.mozPreservesPitch = false;
    node.webkitPreservesPitch = false;
    node.playbackRate = rate;
  }
  // Blocked until the page has been interacted with — that is fine, the
  // visuals never depend on audio.
  const played = node.play();
  if (played && played.catch) played.catch(() => {});
}

/* ------------------------------------------------------------
   Voice-over
   ------------------------------------------------------------ */
let voVoice = null;

function pickVoice() {
  if (!VO.enabled) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;                 // still loading, or none

  const male = (v) => VO.avoid.some((n) => (v.name || '').toLowerCase().includes(n));

  // Best language first, then the youngest-sounding voice within it.
  for (const lang of VO.langPrefs) {
    const inLang = voices.filter(
      (v) => v.lang && v.lang.toLowerCase().startsWith(lang.toLowerCase())
    );
    if (!inLang.length) continue;
    for (const name of VO.namePrefs) {
      const hit = inLang.find((v) => (v.name || '').toLowerCase().includes(name));
      if (hit) return hit;
    }
    // Fall back within the language, but never to a man.
    const notMale = inLang.find((v) => !male(v));
    if (notMale) return notMale;
  }
  // Last resort: any voice that is not one of the male ones.
  return voices.find((v) => !male(v)) || voices[0];
}

/* Try another voice without editing the file: setVoice('zira') in the
   console, then reload a stage to hear it. */
function setVoice(fragment) {
  const hit = window.speechSynthesis.getVoices()
    .find((v) => (v.name || '').toLowerCase().includes(String(fragment).toLowerCase()));
  if (hit) voVoice = hit;
  return hit ? hit.name : 'no match';
}
window.setVoice = setVoice;

function voiceReady() {
  if (!VO.enabled || VO.muted) return false;
  if (!voVoice) voVoice = pickVoice();
  return Boolean(voVoice);
}

/* Speaks `line`, calling back when the voice finishes. Falls back to an
   immediate callback when there is no voice, so the flow keeps its
   deterministic timing rather than waiting on silence. */
function speakLine(line, onEnd, onStart) {
  if (!voiceReady()) {
    if (onStart) onStart();
    if (onEnd) onEnd();
    return;
  }
  window.speechSynthesis.cancel();                 // never let lines queue up

  const utter = new SpeechSynthesisUtterance(line);
  utter.voice = voVoice;
  utter.lang = voVoice.lang;
  utter.rate = VO.rate;
  utter.pitch = VO.pitch;
  utter.volume = VO.volume;

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    if (onEnd) onEnd();
  };
  let began = false;
  const begin = () => { if (began) return; began = true; if (onStart) onStart(); };
  utter.onstart = begin;
  utter.onend = () => { begin(); finish(); };
  utter.onerror = () => { begin(); finish(); };
  // Guards: neither a silent start nor a stalled end may hold the lesson up.
  setTimeout(begin, 700);
  setTimeout(finish, line.length * VO.charMs + 2600);

  window.speechSynthesis.speak(utter);
}

/* Speaks one number, reporting when the voice actually starts and stops. The
   treat lights up on `onStart`, which is what keeps the two together — a timer
   cannot, because each utterance waits its turn in the speech queue. */
function speakNumber(n, hooks) {
  const onStart = (hooks && hooks.onStart) || null;
  const onEnd = (hooks && hooks.onEnd) || null;
  const word = numWord(n);

  if (!voiceReady()) {
    if (onStart) onStart();
    if (onEnd) setTimeout(onEnd, 380);
    return;
  }

  const utter = new SpeechSynthesisUtterance(word);
  utter.voice = voVoice;
  utter.lang = voVoice.lang;
  utter.rate = VO.rate;
  utter.pitch = VO.pitch + 0.08;                   // a touch brighter counting
  utter.volume = VO.volume;

  let started = false;
  let ended = false;
  const begin = () => { if (started) return; started = true; if (onStart) onStart(); };
  const finish = () => { if (ended) return; ended = true; begin(); if (onEnd) onEnd(); };

  utter.onstart = begin;
  utter.onend = finish;
  utter.onerror = finish;
  // Guards, so a silent or stalled engine cannot stall the count.
  setTimeout(begin, 900);
  setTimeout(finish, word.length * VO.charMs + 1600);

  window.speechSynthesis.speak(utter);
}

/* Some browsers hold speech until the page has been interacted with. */
function unlockVoice() {
  if (!VO.enabled) return;
  try { window.speechSynthesis.resume(); } catch (err) { /* nothing to resume */ }
}

function toggleVoice() {
  VO.muted = !VO.muted;
  if (VO.muted && VO.enabled) window.speechSynthesis.cancel();
  return !VO.muted;
}
window.toggleVoice = toggleVoice;                  // console / host hook

/* ------------------------------------------------------------
   On-screen text

   Everything Agni says goes on the plate as well. Lines are put up whole the
   moment the voice starts them: typing a line needs the reveal to keep pace
   with the speech, and any drift between the two is visible on screen.

   The longest line overruns the plate at the design's 56 px, so the size
   steps down until it fits.
   ------------------------------------------------------------ */
const OST_SIZE = { max: 56, min: 30, step: 2, width: 896, height: 112 };

/* Puts a line on the plate at the largest size that fits it. Short lines get
   the design's 56 px; a long one steps down, and wraps onto a second row if it
   still will not fit on one. Level 1's line is 84 characters — at any readable
   size on a single row it runs clean off the plate. */
function showOst(line, done) {
  panelTyped.textContent = line;
  panelCaret.classList.remove('panel__caret--on');

  let size = OST_SIZE.max;
  panelText.style.fontSize = size + 'px';
  while (size > OST_SIZE.min
         && (panelTyped.scrollWidth > OST_SIZE.width
             || panelTyped.scrollHeight > OST_SIZE.height)) {
    size -= OST_SIZE.step;
    panelText.style.fontSize = size + 'px';
  }

  if (done) done();
}

/* ------------------------------------------------------------
   Says a voice-over line. Spoken only — the panel keeps the on-screen text.
   Calls back when Agni finishes, so the lesson is paced by the narration.
   With no voice available it waits a read-aloud beat instead, so the flow
   still advances at something like the right speed.
   ------------------------------------------------------------ */
function say(line, done) {
  stage.dispatchEvent(new CustomEvent('vo', { detail: { line } }));

  if (!voiceReady()) {
    showOst(line);
    setTimeout(() => { if (done) done(); }, line.length * VO.charMs + 300);
    return;
  }
  // Up on the plate the moment he starts it, so the two cannot drift apart.
  speakLine(line, () => { if (done) done(); }, () => showOst(line));
}

/* Speaks several lines back to back. */
function sayAll(lines, done) {
  const list = Array.isArray(lines) ? lines.slice() : [lines];
  const step = () => {
    if (!list.length) { if (done) done(); return; }
    say(list.shift(), step);
  };
  step();
}

/* ------------------------------------------------------------
   Hand nudge
   ------------------------------------------------------------ */
function handTo(x, y) {
  hand.style.setProperty('--hand-x', x + 'px');
  hand.style.setProperty('--hand-y', y + 'px');
}

function handShow(x, y) {
  handTo(x, y);
  hand.classList.add('hand--on');
}

function handHide() {
  hand.classList.remove('hand--on', 'hand--tap', 'hand--point');
}

function handTap(done) {
  hand.classList.remove('hand--point');
  hand.classList.add('hand--tap');
  playSfx('tap');
  setTimeout(() => playSfx('tap'), 620);        // the second dip
  const wait = reduceMotion ? 0 : 1240;   // two dips
  setTimeout(() => {
    hand.classList.remove('hand--tap');
    if (done) done();
  }, wait);
}

function handPointAt(x, y) {
  handTo(x, y);
  hand.classList.add('hand--on', 'hand--point');
}

/* Centre of a key, in frame coordinates — the hand points at the real thing
   rather than at numbers copied by hand. */
function keyCentre(value) {
  const btn = keysLayer.querySelector('.key[data-value="' + value + '"]');
  if (!btn) return { x: JAR_CENTRE_X, y: 700 };
  const x = parseFloat(btn.style.getPropertyValue('--kx')) + KEYPAD_ORIGIN.x;
  const y = parseFloat(btn.style.getPropertyValue('--ky')) + KEYPAD_ORIGIN.y;
  const w = parseFloat(btn.style.getPropertyValue('--kw'));
  const h = parseFloat(btn.style.getPropertyValue('--kh'));
  return { x: x + w / 2, y: y + h / 2 };
}

/* ------------------------------------------------------------
   Counting

   Every count is driven by the voice: the thing being counted lights up on
   its number's `onStart`, and the next number waits for the last to finish.
   A timer cannot stay in step with it, because each utterance queues.

   Loose treats light one at a time. A pack lights as a whole when its ten
   are spoken as one number ("ten", "twenty") — which is the grouping idea
   the transition screens are teaching.
   ------------------------------------------------------------ */
function clearGlows() {
  allTreats().forEach((el) => el.classList.remove('treat--glow'));
  packItems().forEach((it) => it.el.classList.remove('pack--glow'));
}

function countSequence(els, from, done) {
  if (!els.length) { done(); return; }
  const token = state.gen;
  let i = 0;
  const next = () => {
    if (!stillCurrent(token)) return;
    if (i >= els.length) { stageTimeout(done, FLOW.afterCount); return; }
    const el = els[i];
    const n = from + i;
    speakNumber(n, {
      onStart: () => {
        el.classList.add('treat--glow');
        playSfx('count', countRate(n));
        /* The counting line is marked (VO) in the script — spoken, never
           written. The plate keeps the line before it while Agni counts. */
        stage.dispatchEvent(new CustomEvent('count', { detail: { n } }));
      },
      onEnd: () => { i += 1; stageTimeout(next, FLOW.countGap); }
    });
  };
  next();
}

function countLoose(from, done) {
  countSequence(looseItems().map((it) => it.el), from, done);
}

function countGroupItems(index, from, done) {
  const pack = packItems()[index];
  if (!pack || !pack.members) { done(); return; }
  countSequence(pack.members.map((m) => m.el), from, done);
}

function countGroupTotal(index, say, done) {
  const pack = packItems()[index];
  if (!pack) { done(); return; }
  speakNumber(say, {
    onStart: () => {
      pack.el.classList.add('pack--glow', 'pack--marked');
      playSfx('count', countRate(10));
      stage.dispatchEvent(new CustomEvent('count', { detail: { n: say } }));
    },
    onEnd: () => stageTimeout(done, FLOW.countGap)
  });
}

/* ------------------------------------------------------------
   Keys: during the guided steps only one is live
   ------------------------------------------------------------ */
function restrictKeys(allowed) {
  state.allowed = allowed;
  keysLayer.querySelectorAll('.key').forEach((btn) => {
    const ok = !allowed || allowed.includes(btn.dataset.value);
    btn.classList.toggle('key--muted', !ok);
    btn.disabled = !ok;
  });
}

function unlockKeypad() {
  state.locked = false;
  keysLayer.classList.remove('is-locked');
}

/* ------------------------------------------------------------
   The pad opens on a tap of the answer panel
   ------------------------------------------------------------ */
function shutKeypad() {
  keypadPlates.classList.add('keypad--closed');
  keysLayer.classList.add('keys--closed', 'is-locked');
  answerPanel.classList.add('answer--waiting');   // centred in the jar
  state.locked = true;
}

function armPanel() {
  displayHit.hidden = false;
  displayPanel.classList.add('display--hint');
}

function openKeypad() {
  if (!keypadPlates.classList.contains('keypad--closed')) return;

  displayPanel.classList.remove('display--hint');
  displayHit.hidden = true;

  // The panel lifts to its design spot first, then the pad opens beneath it.
  answerPanel.classList.remove('answer--waiting');

  const showPad = () => {
    keypadPlates.classList.remove('keypad--closed');
    keysLayer.classList.remove('keys--closed');
    playSfx('padOpen');

    if (!reduceMotion) {
      keypadPlates.classList.add('keypad--opening');
      keysLayer.classList.add('keys--opening');
      keysLayer.addEventListener('animationend', () => {
        keypadPlates.classList.remove('keypad--opening');
        keysLayer.classList.remove('keys--opening');
      }, { once: true });
    }
    unlockKeypad();
  };

  if (reduceMotion) showPad();
  else setTimeout(showPad, PAD_OPEN_AFTER_LIFT);
}

/* ============================================================
   The stage engine

   Each stage in STAGES is a list of steps. A step can speak a line, change
   the on-screen text, count something, or hand control to the child. Steps
   that hand over (`nudgeKeys`, `awaitTap`) end the chain — the child's tap
   is what moves things on from there.
   ============================================================ */
function currentStage() {
  return STAGES[state.stageIndex];
}

/* Every stage gets a token. Anything scheduled by a stage checks it before
   acting, so a pending timer from the stage just finished can never reach
   into the next one — which is how a previous stage's group highlight ended
   up marking a pack on the following screen. */
function stageToken() {
  return state.gen;
}

function stillCurrent(token) {
  return token === state.gen;
}

/* setTimeout that gives up if the stage has moved on. */
function stageTimeout(fn, ms) {
  const token = state.gen;
  return setTimeout(() => { if (stillCurrent(token)) fn(); }, ms);
}

function runSteps(steps, i, done, token) {
  if (token === undefined) token = state.gen;
  if (!stillCurrent(token)) return;
  if (i >= steps.length) { if (done) done(); return; }
  const step = steps[i];
  const stg = currentStage();
  const next = () => runSteps(steps, i + 1, done, token);

  if (step.ost) showOst(stg.ost[step.ost] || step.ost);
  if (step.highlightGroups) {
    packItems().forEach((p) => p.el.classList.add('pack--marked'));
  }

  if (step.countLoose) { countLoose(step.countLoose.from, next); return; }
  if (step.countGroupItems) {
    countGroupItems(step.countGroupItems.group, step.countGroupItems.from, next);
    return;
  }
  if (step.countGroupTotal) {
    countGroupTotal(step.countGroupTotal.group, step.countGroupTotal.say, next);
    return;
  }
  if (step.nudgeScreen) { nudgeToPanel(next); return; }

  /* Script order: the hand reaches the number first, then Agni prompts over
     it — so the child is never watching a still screen. */
  if (step.nudgeKeys) {
    nudgeToKeys();
    if (step.vo) say(step.vo);
    return;
  }
  if (step.awaitTap) { awaitChildTap(); return; }
  if (step.vo) { say(step.vo, next); return; }
  next();
}

/* ------------------------------------------------------------
   Guided: the hand taps the panel, then walks the digits
   ------------------------------------------------------------ */
function nudgeToPanel(done) {
  const x = 1260 + 417 / 2;
  const y = 358 + 156 / 2 + 196;      // the panel is still centred in the jar
  handShow(x, y);
  setTimeout(() => handTap(() => {
    openKeypad();
    setTimeout(() => { if (done) done(); }, FLOW.afterTap);
  }), FLOW.handSettle);
}

/* The answer can be two digits. The hand points at the one that is due, and
   only that one responds — "hand nudge will appear on 4 and then 2". */
function pointAtExpected() {
  const digit = state.expect[state.entry.length];
  if (!digit) return;
  restrictKeys([digit]);
  const c = keyCentre(digit);
  handPointAt(c.x, c.y);
}

function nudgeToKeys() {
  state.expect = String(currentStage().answer).split('');
  pointAtExpected();
  unlockKeypad();
}

/* ------------------------------------------------------------
   The child's turn: tap the jar, then enter the number
   ------------------------------------------------------------ */
function clearIdleTimer() {
  if (state.idleTimer) { clearTimeout(state.idleTimer); state.idleTimer = null; }
}

function armIdleNudge() {
  clearIdleTimer();
  state.idleTimer = setTimeout(() => {
    // The script's inactivity rule: nudge the jar, and wiggle it. A creak
    // from the spooky house is the nudge's own little voice.
    playSfx('creak');
    answerPanel.classList.add('answer--wiggle');
    const x = 1260 + 417 / 2;
    const y = 358 + 156 / 2 + 196;
    handPointAt(x, y);
  }, IDLE_NUDGE_MS);
}

function awaitChildTap() {
  displayHit.hidden = false;
  displayPanel.classList.add('display--hint');
  armIdleNudge();

  const onTap = () => {
    clearIdleTimer();
    handHide();
    answerPanel.classList.remove('answer--wiggle');
    openKeypad();
    setTimeout(() => {
      state.expect = null;              // the child chooses freely
      restrictKeys(null);
      unlockKeypad();
    }, FLOW.afterTap);
  };
  displayHit.addEventListener('click', onTap, { once: true });
}

/* ------------------------------------------------------------
   Hints — the script's three-step ladder
   ------------------------------------------------------------ */
function giveHint() {
  const stg = currentStage();
  const hints = stg.hints || [];
  const hint = hints[Math.min(state.wrong - 1, hints.length - 1)];
  if (!hint) return;

  if (state.wrong >= 3) {
    // "A hand nudge appears on 9. Only 9 remains clickable."
    say(hint);
    state.expect = String(stg.answer).split('');
    pointAtExpected();
  } else {
    say(hint);
  }
}

/* ------------------------------------------------------------
   Running a stage, and moving to the next
   ------------------------------------------------------------ */
function startStage(index) {
  state.gen += 1;                 // anything the last stage scheduled is void
  state.stageIndex = index;
  const stg = currentStage();

  state.entry = '';
  state.answer = stg.answer;
  state.wrong = 0;
  state.expect = null;
  state.locked = true;
  clearIdleTimer();
  handHide();
  clearFeedback();
  paintDisplay();

  jarLid.classList.remove('jar-lid--on');
  sparkles.classList.remove('sparkles--on');
  sparkles.innerHTML = '';
  stage.classList.remove('stage--clearing', 'stage--closing');
  answerPanel.classList.remove('answer--wiggle');
  displayHit.hidden = true;
  displayPanel.classList.remove('display--hint');

  renderStage(stg);
  if (index > 0) playSfx('stage');
  shutKeypad();
  showOst(stg.ost.main);
  stage.dispatchEvent(new CustomEvent('stagestart', { detail: { id: stg.id, index } }));

  setTimeout(revealTreats, 260);
  setTimeout(() => runSteps(stg.steps, 0), 260 + FLOW.afterOst);
}

/* ------------------------------------------------------------
   Moving on: the camera travels to the next jar

   The scene slides off one side, the next stage is built while it is out of
   frame, and it slides in from the other — so finishing a task feels like
   moving along the kitchen rather than a screen being swapped underneath you.
   ------------------------------------------------------------ */
const CAM = { travel: 1920, out: 600, settle: 760 };

function panToStage(index) {
  if (reduceMotion) { startStage(index); return; }

  playSfx('pan');
  stage.classList.add('stage--panning');       // the room leans, it does not move
  world.classList.add('world--out');
  world.style.setProperty('--cam-x', -CAM.travel + 'px');

  setTimeout(() => {
    // Out of frame: build the next stage, then jump the camera round to the
    // far side without animating, ready to come back in.
    startStage(index);
    world.classList.remove('world--out');
    world.style.setProperty('--cam-x', CAM.travel + 'px');

    // Two frames, so the jump is committed before the transition is armed.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      world.classList.add('world--in');
      world.style.setProperty('--cam-x', '0px');
      stage.classList.remove('stage--panning');
      setTimeout(() => world.classList.remove('world--in'), CAM.settle + 40);
    }));
  }, CAM.out);
}

function nextStage() {
  if (state.stageIndex + 1 >= STAGES.length) {
    stage.dispatchEvent(new CustomEvent('sectioncomplete', {}));
    return;
  }
  panToStage(state.stageIndex + 1);
}

/* ------------------------------------------------------------
   Opening: Agni flies in, the plate unrolls, then stage one
   ------------------------------------------------------------ */
function playIntro() {
  state.locked = true;
  restrictKeys([]);

  if (reduceMotion) {
    agniStand.classList.remove('agni-stand--waiting');
    panelPlate.classList.remove('panel__plate--closed');
    startStage(0);
    return;
  }

  panelPlate.classList.add('panel__plate--closed');
  agniStand.classList.add('agni-stand--waiting');
  agni.classList.add('agni--in', 'agni--flying');

  setTimeout(() => {
    agniStand.classList.remove('agni-stand--waiting');
    agni.classList.remove('agni--flying');
  }, INTRO.landAt);

  setTimeout(() => {
    panelPlate.classList.remove('panel__plate--closed');
    panelPlate.classList.add('panel__plate--open');
    playSfx('panelOpen');
  }, INTRO.panelAt);

  setTimeout(() => startStage(0), INTRO.typeAt);
}

/* ------------------------------------------------------------
   Input wiring
   ------------------------------------------------------------ */
function bindKeypad() {
  keysLayer.addEventListener('click', (e) => {
    const btn = e.target.closest('.key');
    if (btn) handleKey(btn.dataset.type, btn.dataset.value);
  });

  // Press highlight (pointer events cover mouse, touch and pen)
  keysLayer.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.key');
    if (btn) btn.classList.add('is-pressed');
  });
  // pointerout bubbles (pointerleave does not), so it reaches this layer
  ['pointerup', 'pointercancel', 'pointerout'].forEach((type) => {
    keysLayer.addEventListener(type, (e) => {
      const btn = e.target.closest('.key');
      if (btn) btn.classList.remove('is-pressed');
    });
  });
}

function flashKey(value) {
  const btn = keysLayer.querySelector('.key[data-value="' + value + '"]');
  if (!btn) return;
  btn.classList.add('is-pressed');
  setTimeout(() => btn.classList.remove('is-pressed'), 120);
}

function bindKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
      pressDigit(e.key);
      flashKey(e.key);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      pressClear();
      flashKey('X');
    } else if (e.key === 'm' || e.key === 'M') {
      toggleVoice();
    } else if (e.key === 'Enter') {
      // A focused key handles its own Enter via click — don't fire twice.
      if (document.activeElement && document.activeElement.classList.contains('key')) return;
      pressSubmit();
      flashKey('ok');
    }
  });
}

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */
function initVoice() {
  if (!VO.enabled) return;
  voVoice = pickVoice();
  // Chrome populates the voice list asynchronously.
  window.speechSynthesis.onvoiceschanged = () => { voVoice = pickVoice(); };
  window.addEventListener('pointerdown', unlockVoice, { once: true });
  window.addEventListener('keydown', unlockVoice, { once: true });
}

function init() {
  fitStage();
  window.addEventListener('resize', fitStage);
  window.addEventListener('orientationchange', fitStage);

  renderKeys();
  paintDisplay();
  displayHit.hidden = true;
  bindKeypad();
  bindKeyboard();
  loadSfx();
  initVoice();
  playIntro();
}

init();
