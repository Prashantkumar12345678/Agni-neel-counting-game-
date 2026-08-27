/* ============================================================
   Agni & Nil — Counting Game · Screen 1
   Figma: nil-and-agni-count-game · frame 190:495 · canvas 1920 x 1080

   The screen is data-driven: treats and keys are described by the
   coordinate tables below (taken straight from the design) and
   rendered into the fixed 1920x1080 stage.
   ============================================================ */

'use strict';

const DESIGN = { w: 1920, h: 1080 };

/* The tutorial's six treats, from the design's own group (`285:16` inside
   frame `267:137`): a tidy 3 x 2, all upright, all the same size, read left to
   right and top to bottom — which is the order they are counted in. `s` is the
   1254 px canvas each is drawn at, straight from the design. */
const TUTORIAL_TREATS = [
  { cx: 192.6, cy: 426.6, s: 280.7 },
  { cx: 515.4, cy: 423.4, s: 280.7 },
  { cx: 838.1, cy: 420.1, s: 280.7 },
  { cx: 192.6, cy: 736.6, s: 280.7 },
  { cx: 515.4, cy: 733.4, s: 280.7 },
  { cx: 838.1, cy: 730.1, s: 280.7 }
];

/* The seven treats.

   Every one is the design's own 1254 x 1254 PNG with the drawing centred on
   transparency, so canvas and drawing box are a single number for all of them
   and a size measured off a design frame drops straight in.

   `size` is the square the image is drawn at on the table. `ink`/`inkH` say how
   much of that square the drawing actually covers, across and down: spacing has
   to go by those, because by the square alone the walnuts drift apart and by
   the width alone the tall ones stack into each other.

   `eyes` is for the blink. There is no closed-eye frame, so each lid paints a
   patch of the treat's own skin over the eye plus a lash line; `dx`/`dy` say
   where that patch comes from, in eye-widths and eye-heights. Boxes were found
   by locating the pupils by darkness and growing each into its eye white,
   refusing growth that runs away — the marshmallow's body is white and touches
   its eyes. Values are fractions of the 1254 square: [x, y, w, h].  */
const ART = {
  /* The apple and the strawberry both carry leaves straight above their eyes,
     so their lids take skin from below. Scoring alone picks the leaves, because
     flat green beats textured fruit on flatness. */
  apple:  { file: 'apple.png',       size: 280, ink: 0.732, inkH: 0.772,
             eyes: { dx: 0, dy: 1.25, l: [0.248, 0.4326, 0.2146, 0.26],
                     r: [0.5199, 0.4338, 0.2146, 0.2568] } },
  candy:  { file: 'candy.png',       size: 241, ink: 0.900, inkH: 0.513,
             eyes: { dx: 0, dy: 1.25, l: [0.3437, 0.4723, 0.091, 0.1032],
                     r: [0.5527, 0.4733, 0.09, 0.1021] } },
  jelly:  { file: 'jelly.png',       size: 267, ink: 0.837, inkH: 0.856,
             eyes: { dx: 0, dy: 1.25, l: [0.2833, 0.3381, 0.1384, 0.1579],
                     r: [0.5709, 0.3267, 0.1404, 0.16] } },
  /* The one treat with no clean patch anywhere: leaves above, and the fruit
     narrows to a point too soon below to fill a lid the size of its eye. It
     names its skin colour and the lid paints that instead. */
  straw:  { file: 'strawberry.png',  size: 355, ink: 0.687, inkH: 0.815,
             eyes: { dx: 0, dy: 1.25, fill: 'linear-gradient(#e01c11, #ad0a04)',
                     l: [0.2801, 0.4478, 0.1958, 0.2526],
                     r: [0.5172, 0.4491, 0.1928, 0.2421] } },
  marsh:  { file: 'marshmallow.png', size: 408, ink: 0.622, inkH: 0.682,
             eyes: { dx: 0, dy: -1.25, l: [0.2497, 0.4326, 0.2642, 0.2863],
                     r: [0.5156, 0.433, 0.2674, 0.2846] } },
  berry:  { file: 'berry.png',       size: 344, ink: 0.640, inkH: 0.642,
             eyes: { dx: 0, dy: -1.25, l: [0.3179, 0.4841, 0.1266, 0.1442],
                     r: [0.5669, 0.4841, 0.1246, 0.1442] } },
  walnut: { file: 'walnut.png',      size: 459, ink: 0.575, inkH: 0.774,
             eyes: { dx: 0, dy: 1.25, l: [0.2985, 0.3988, 0.1869, 0.2168],
                     r: [0.5344, 0.3997, 0.1879, 0.2158] } },
};

/* Every treat asset is the same square, so the canvas and the drawing box are
   one number for all of them. */
const TREAT_CANVAS = 1254;
Object.keys(ART).forEach((k) => {
  ART[k].canvas = [TREAT_CANVAS, TREAT_CANVAS];
  ART[k].art = TREAT_CANVAS;
});

/* The packets, and where their ten treats sit inside them.

   Each file is built so its own aspect is already the shape the design draws
   the packet in, so nothing is stretched at run time and the treats keep their
   proportions. Getting there took care (see fig/build_packs3.py): the bag files
   carry a dark outline *outside* the white bag, which the design crops away and
   which reads as a stray grey line above the pack if it is kept; and Figma can
   stretch the bag without stretching the treats only because they are separate
   layers there, so that stretch is baked into the file here instead.

   The redesign builds a packet from a shared translucent bag plus a 5 x 2 grid
   image of the treat. A packet has to fly and land as one thing here, so the
   two layers are composited into one PNG per stage at the design's own
   proportions; only the jelly and strawberry packets came out of Figma already
   whole.

   `grid` is [x, y, w, h] around the 5 x 2 of treats, in the packet's own
   pixels. It lets a single treat inside a flat packet be lit up on its own: a
   cell is drawn as a crop of the very same image, exactly over its treat, so at
   rest it is invisible and when it pops the treat appears to jump out of the
   pack. Without this, counting inside a group — which Transition 1 needs —
   would only work on a group drawn as ten separate treats. */
/* How far each of a pack's ten crops reaches past its share of the grid, as a
   fraction of the cell. Enough to take in the whole treat — they are drawn
   almost as wide as their cell — and the stylesheet fades the same margin out
   again so the neighbours it also takes in do not show. */
const PACK_CELL_PAD = 0.09;

const PACKETS = {
  jelly:   { file: 'Yellow packet.png', size: [685, 361],
            grid: [43, 56, 586, 239] },
  straw:   { file: 'packet-strawberry.png', size: [1402, 1122],
            grid: [109, 321, 1177, 548] },
  /* The design keeps this one whole, in the Assets folder rather than in a
     frame — same bag as the blueberry packet, at 477 x 260. */
  marsh:   { file: 'marsmalo packet.png', size: [477, 260],
            grid: [30, 33, 417.9, 185] },
  walnut:  { file: 'packet-walnut.png', size: [1275, 809],
            grid: [104, 156, 1062, 500] },
  berry:   { file: 'packet-berry.png', size: [1905, 1037],
            grid: [167, 164, 1605, 694] },
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
      { vo: 'It is your turn to pack now!' },
      /* "Count first and then write the magic number on the jar. (VO +
         interaction)" — spoken over the pad, not written up. */
      { vo: 'Count first and then write the magic number on the jar.',
        voOnly: true },
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
      // "Look! These treats are in a group. (VO + pop)"
      { vo: 'Look! These treats are in a group. Let us count them.',
        voOnly: true },
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
      // "Look! We have 2 groups of 10 here. [VO+pop]"
      { vo: 'Look! We have 2 groups of 10 here.', highlightGroups: true,
        voOnly: true },
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
      // "It is your turn to pack now! (VO)"
      { vo: 'It is your turn to pack now!', voOnly: true },
      { vo: 'Count all the treats in groups and loose first and then write '
          + 'the magic number on the jar.' },
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
    /* The script gives this level two on-screen lines: the task, then what to
       do once they have the total. */
    ost: { main: 'Count all the treats.',
           enter: 'Write the number on the jar.',
           success: 'Well done!' },
    steps: [
      { vo: 'Count all the treats in groups and loose first and then write the magic number on the jar.' },
      { ost: 'enter', awaitTap: true }
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

/* How long the screen has to sit untouched before the treats start breathing
   and blinking again. Declared up here with the other timings, not beside
   wakeUp(): wakeUp is hoisted and showOst() calls it, so a `let` next to the
   function would be in its dead zone for anything that ran early. */
const SLEEPY_MS = 10000;

/* The answer plate's centre — `answer box 2.png` drawn 324 x 121.2 at
   (1367, 405), centred on the jar. Both the "tap here" hand and the inactivity
   nudge point at it. */
const ANSWER_CENTRE = { x: 1529, y: 405 + 121.2 / 2 };

/* Keypad hit-area grid. The plates are baked into keypad.png, so each
   key is a transparent rectangle laid over its plate. Centres are taken
   from the plate artwork; the bottom-right cell is the green submit
   button, which has its own exact rect from the design (190:533). */
/* The pad is a clean 3 x 4 grid: 503 x 395 at (1260, 523) divides into cells
   of 167.67 x 98.75, and the design's digits sit on exactly those centres. */
/* `keypad.png` is now the whole pad — twelve finished plates with their
   digits, a red X and a green tick drawn into it. So there are no glyphs to
   set and no separate artwork for the tick: the keys are transparent hit
   areas, and their rectangles are measured off the picture rather than laid
   out on a grid of my own, so a tap lands on the plate a child aims at.

   The art is 1180 x 1333 and its twelve plates sit at these rectangles. It is
   taller than it is wide, where the old pad was wider than tall, so the pad
   fills the jar's lower half instead of a shallow band across it. */
const PAD_ART = { w: 514, h: 563 };
const PAD_PLATES = [
  [ 25,  11, 150, 133], [187,  11, 148, 133], [346,  11, 149, 133],
  [ 24, 149, 151, 129], [187, 150, 147, 129], [346, 150, 149, 129],
  [ 24, 284, 151, 130], [187, 283, 147, 131], [345, 284, 150, 132],
  [ 24, 420, 151, 128], [187, 419, 147, 128], [346, 420, 149, 127]
];

const KEYPAD_RECT = { x: 1351, y: 539, w: 357.0, h: 391.0 };
const PAD_K = KEYPAD_RECT.w / PAD_ART.w;

/* A plate's rectangle on the stage, from its rectangle in the art. */
function plateRect(i) {
  const [x, y, w, h] = PAD_PLATES[i];
  return { x: KEYPAD_RECT.x + x * PAD_K, y: KEYPAD_RECT.y + y * PAD_K,
           w: w * PAD_K, h: h * PAD_K };
}
/* The submit key keeps the design's own rect rather than the grid cell. */
const SUBMIT_RECT = plateRect(11);      // the green tick, bottom right

/* Key rects below are written in frame coordinates, then re-based onto the
   keypad's own box so the plates and the digits open as one piece. */
const KEYPAD_ORIGIN = { x: KEYPAD_RECT.x, y: KEYPAD_RECT.y };

/* Keys — glyph positions are the exact text coordinates from the
   design (190:519), so the hand-placed offsets are preserved. */
/* `plate` indexes PAD_PLATES, so every key's hit area is the plate a child
   can see. Nothing here draws: the labels are for the screen reader. */
const KEYS = [
  { type: 'digit',  value: '1', label: '1', plate: 0,  col: 0, row: 0 },
  { type: 'digit',  value: '2', label: '2', plate: 1,  col: 1, row: 0 },
  { type: 'digit',  value: '3', label: '3', plate: 2,  col: 2, row: 0 },
  { type: 'digit',  value: '4', label: '4', plate: 3,  col: 0, row: 1 },
  { type: 'digit',  value: '5', label: '5', plate: 4,  col: 1, row: 1 },
  { type: 'digit',  value: '6', label: '6', plate: 5,  col: 2, row: 1 },
  { type: 'digit',  value: '7', label: '7', plate: 6,  col: 0, row: 2 },
  { type: 'digit',  value: '8', label: '8', plate: 7,  col: 1, row: 2 },
  { type: 'digit',  value: '9', label: '9', plate: 8,  col: 2, row: 2 },
  { type: 'clear',  value: 'X', label: 'back', plate: 9,  col: 0, row: 3 },
  { type: 'digit',  value: '0', label: '0', plate: 10, col: 1, row: 3 },
  { type: 'submit', value: 'ok', label: 'Check answer', plate: 11, col: 2, row: 3 }
];

const MAX_DIGITS = 2;

/* The answer panel's lift is 520 ms; the pad starts opening partway up so
   the two moves read as one gesture. */
const PAD_OPEN_AFTER_LIFT = 260;

/* Where the treats go once the answer is right. The mouth was measured off
   Jar.png — its opening is centred on (1454, 287) and the neck is 507 px
   across — and the pile is a pyramid on the jar's floor. */
const JAR_GATE = { x: 1529, y: 30 };     // well above the jar — they fall from height
const JAR_MOUTH = { x: 1529, y: 360 };   // the opening itself, on the new rim

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
const JAR_CENTRE_X = 1529;
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
  /* Agni's fly-past, and the sheet that rolls off behind him. Must match the
     duration of cross-wipe / cross-edge / cross-fly in the stylesheet: this is
     when the sheet is taken away, and while it read 1450 against their 3000 the
     sheet vanished at 60% of the roll. */
  crossing: 6000,
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
    pan: 'pan.ogg',           // the camera moving to the next jar
    agniFly: 'agni-fly.wav'   // wingbeats and a sparkle as he lands
  },
  /* The supplied background track. Kept well under the cues — it plays behind
     a voice counting, so it has to stay out of the way. (`room-tone.wav`, the
     synthesised bed this replaces, is left in the folder unused.) */
  bed: { file: 'BG  music.mp3', volume: 0.15 },
  /* Per-cue level, because the packs are not mixed to each other. */
  gain: {
    count: 0.55, tap: 0.4, key: 0.5, padOpen: 0.45, panelOpen: 0.5,
    correct: 0.5, wrong: 0.4, berryFly: 0.3, berryLand: 0.4, capClose: 0.9,
    win: 0.62, stage: 0.42, capSeal: 0.55, coins: 0.5, creak: 0.3, pan: 0.45,
    agniFly: 0.5
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
  reveal: 260,          // beat before the treats pop in
  afterPanel: 260,      // pause once the plate is open, then the on-screen text
  /* Only the stages whose first line is unspoken put their own line up first,
     and nothing replaces it there — so this no longer has to be long enough to
     read a line that is about to be swapped. */
  afterOst: 450,        // then Agni starts talking
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
const begin = document.getElementById('begin');
const cross = document.getElementById('cross');
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
  sleepyTimer: null,
  talking: 0,
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
  const tries = [];
  for (let rows = 1; rows <= PACK_ROWS_MAX; rows += 1) {
    const cols = Math.ceil(g / rows);
    let h = (YARD.h - (rows - 1) * gap.y) / rows;
    let w = h * aspect;

    const maxW = (YARD.w * share - (cols - 1) * gap.x) / cols;
    if (w > maxW) { w = maxW; h = w / aspect; }
    if (w > PACK_MAX.w) { w = PACK_MAX.w; h = w / aspect; }
    if (h > PACK_MAX.h) { h = PACK_MAX.h; w = h * aspect; }
    tries.push({ rows, cols, w, h, gap });
  }

  /* Biggest wins, but only clearly: within a sixth of the best area the block
     that is squarer is the one the design draws — four packets as 2 x 2, not
     as a single column of four — and it leaves the loose treats a sensible
     shape of space beside it. */
  const top = Math.max.apply(null, tries.map((t) => t.w * t.h));
  const want = Math.ceil(Math.sqrt(g));
  const good = tries.filter((t) => t.w * t.h >= top * 0.84);
  good.sort((a, b) => Math.abs(a.cols - want) - Math.abs(b.cols - want)
    || b.w * b.h - a.w * a.h);
  return good[0];
}

function stageArt(stage) {
  return ART[stage.treat] || ART.berry;
}

/* The design's own arrangement of the yard, for the stages whose packs fill it.

   Level 3 came out of the file: five packets, 477 wide, at these exact
   coordinates (`272:409`). Transition 2, Level 2 and Level 4 were measured off
   the design's renders instead — their frames' node ids are not reachable — so
   those are good to a few pixels rather than exact. Each pack gives its top-left and its
   width; the height follows the packet's own aspect. Loose treats give their
   centre and the 1254 px canvas to draw the treat at.

   Stages not listed here fall through to the general layout below. */
/* The loose walnuts: five down the near column, four staggered between them.

   Walnuts draw taller inside their square than any other treat (inkH 0.774),
   so the pitch is worked out from how tall one actually draws rather than
   guessed. At the old 167px square they stood 129 tall on a 108 pitch and grew
   into each other — which is why the drawn square here is smaller than the
   figure the rest of the game uses for a walnut. The columns are 120 apart and
   a walnut is only 77 wide, so across is already clear. */
const WALNUT_COL = { x: [860, 980], top: 500, rows: 5, s: 134, gap: 11 };

function walnutColumns() {
  const c = WALNUT_COL;
  const pitch = c.s * ART.walnut.inkH + c.gap;
  const out = [];
  for (let r = 0; r < c.rows; r += 1) {
    out.push({ cx: c.x[0], cy: c.top + r * pitch, s: c.s });
    // The staggered column has one fewer, sitting between its neighbours.
    if (r < c.rows - 1) {
      out.push({ cx: c.x[1], cy: c.top + (r + 0.5) * pitch, s: c.s });
    }
  }
  return out;
}

const YARD_LAYOUT = {
  level2: {
    packs: [
      { x: 68, y: 212, w: 467 }, { x: 585, y: 212, w: 467 },
      { x: 68, y: 493, w: 467 }, { x: 68, y: 772, w: 467 }
    ],
    loose: [{ cx: 635, cy: 571, s: 145 }, { cx: 635, cy: 686, s: 145 }]
  },
  transition2: {
    packs: [{ x: 90, y: 236, w: 524 }, { x: 90, y: 600, w: 524 }],
    // A zigzag of two columns, the way the design stacks them.
    loose: [
      { cx: 756, cy: 344, s: 140 }, { cx: 756, cy: 472, s: 140 },
      { cx: 924, cy: 472, s: 140 }, { cx: 756, cy: 612, s: 140 },
      { cx: 756, cy: 736, s: 140 }, { cx: 924, cy: 736, s: 140 },
      { cx: 756, cy: 864, s: 140 }
    ]
  },
  level3: {
    packs: [
      { x: 52, y: 223, w: 477 }, { x: 582, y: 223, w: 477 },
      { x: 31, y: 500, w: 477 }, { x: 555, y: 511, w: 477 },
      { x: 290, y: 793, w: 477 }
    ],
    loose: []
  },
  level4: {
    packs: [
      { x: 50, y: 236, w: 330 }, { x: 420, y: 236, w: 330 },
      { x: 800, y: 236, w: 330 },
      { x: 50, y: 510, w: 330 }, { x: 420, y: 510, w: 330 },
      { x: 50, y: 760, w: 330 }, { x: 420, y: 760, w: 330 }
    ],
    /* Two columns filling the space the third column of packs leaves. They
       start below that third packet rather than beside it — begun level with
       it, the top of the column ran into the pack. */
    loose: walnutColumns()
  }
};

/* Lays a stage out from YARD_LAYOUT, when the design has one for it. */
function designYard(stage, art) {
  const laid = YARD_LAYOUT[stage.id];
  if (!laid || laid.packs.length < stage.groups
      || laid.loose.length < stage.loose) return null;
  const packet = stage.packet ? PACKETS[stage.packet] : null;
  const aspect = packet ? packet.size[0] / packet.size[1] : PACK_ASPECT;

  const items = laid.packs.slice(0, stage.groups).map((slot) => ({
    kind: 'pack', x: slot.x, y: slot.y,
    w: slot.w, h: slot.w / aspect, packet: stage.packet || null
  }));
  laid.loose.slice(0, stage.loose).forEach((slot) => items.push({
    kind: 'loose', cx: slot.cx, cy: slot.cy, scale: slot.s / art.art
  }));
  return items;
}

/* The design's own single-packet yard, measured off its Transition 1 frame:
   the packet at (133, 250) drawn 679 wide, the loose treats in a row beneath
   it. Everything else here follows from the packet: the row lines up with the
   packet's treat columns and takes its size from them, so the child sees the
   same object at the same size inside the pack and outside it. */
const ONE_GROUP = { x: 133, y: 250, w: 679 };

function oneGroupYard(stage, art) {
  const items = [];
  const packet = PACKETS[stage.packet];
  const packW = ONE_GROUP.w;
  const packH = packW / (packet.size[0] / packet.size[1]);
  items.push({ kind: 'pack', x: ONE_GROUP.x, y: ONE_GROUP.y,
               w: packW, h: packH, packet: stage.packet });

  const k = packW / packet.size[0];
  const cellW = (packet.grid[2] / 5) * k;
  const firstCx = ONE_GROUP.x + (packet.grid[0] + packet.grid[2] / 10) * k;
  const looseArt = (cellW * 0.9) / art.ink;         // the same treat, same size
  const cy = ONE_GROUP.y + packH + looseArt * art.inkH * 0.79;

  for (let i = 0; i < stage.loose; i += 1) {
    items.push({ kind: 'loose', cx: firstCx + i * cellW * 1.12, cy,
                 scale: looseArt / art.art });
  }
  return items;
}

/* The floor. The background is a room, and the wall across the top of it runs
   down to y 345 — so anything drawn above that is standing on the wall, which
   is where the top row of packs was sitting. Everything the child counts has to
   be inside this band. It stops at x 1200 for the jar. */
const YARD_BAND = { top: 362, bottom: 1046, left: 30, right: 1200 };

/* Fits a laid-out yard into that band.

   The arrangements come from design frames whose background was a plain floor
   from top to bottom, so they use the full height. This room has a wall in the
   way and the usable height is smaller, so the yard is scaled down about its
   own centre until it fits and set down with its top on the floor. Scaled, not
   shifted: shifting a yard 840 tall into a band of 684 only pushes the bottom
   of it off the screen. */
function standOnFloor(items, art) {
  if (!items.length) return items;

  const boxOf = (it) => {
    if (it.kind === 'pack') return [it.x, it.y, it.x + it.w, it.y + it.h];
    const w = art.art * it.scale * art.ink;
    const h = art.art * it.scale * art.inkH;
    return [it.cx - w / 2, it.cy - h / 2, it.cx + w / 2, it.cy + h / 2];
  };
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  items.forEach((it) => {
    const q = boxOf(it);
    l = Math.min(l, q[0]); t = Math.min(t, q[1]);
    r = Math.max(r, q[2]); b = Math.max(b, q[3]);
  });

  const k = Math.min(1,
    (YARD_BAND.bottom - YARD_BAND.top) / (b - t),
    (YARD_BAND.right - YARD_BAND.left) / (r - l));
  const mid = (l + r) / 2;
  /* Keep the yard where it is across the frame unless the scaled width no
     longer fits, in which case centre it in the band. */
  const half = (r - l) * k / 2;
  const toMid = Math.min(Math.max(mid, YARD_BAND.left + half),
                         YARD_BAND.right - half);

  if (k === 1 && t >= YARD_BAND.top && b <= YARD_BAND.bottom) return items;

  items.forEach((it) => {
    if (it.kind === 'pack') {
      it.x = toMid + (it.x - mid) * k;
      it.y = YARD_BAND.top + (it.y - t) * k;
      it.w *= k; it.h *= k;
    } else {
      it.cx = toMid + (it.cx - mid) * k;
      it.cy = YARD_BAND.top + (it.cy - t) * k;
      it.scale *= k;
    }
  });
  return items;
}

function layoutStage(stage) {
  return standOnFloor(layoutStageRaw(stage), stageArt(stage));
}

function layoutStageRaw(stage) {
  const items = [];
  const art = stageArt(stage);

  if (stage.id === 'tutorial') {
    // The design places these six itself, so take its grid as it stands.
    TUTORIAL_TREATS.forEach((t) => items.push({
      kind: 'loose', cx: t.cx, cy: t.cy, scale: t.s / art.art
    }));
    return items;
  }

  const g = stage.groups;

  /* One pack and a few loose treats is the arrangement the design draws
     differently: the single packet goes across the top of the yard, drawn wide,
     and the loose treats sit in one row underneath it, lined up with the
     packet's own columns and drawn about the size of the ten inside it. With
     two or more packs the design falls back to a block of packs with the loose
     ones beside them, which is what the general path below does. */
  if (g === 1 && stage.packet && stage.loose > 0 && stage.loose <= 5) {
    return oneGroupYard(stage, art);
  }

  const laid = designYard(stage, art);
  if (laid) return laid;

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

    /* The drawing covers only part of its square, so spacing goes by the
       drawing while the size itself stays the square the image is drawn at.
       Spacing by the square would drift the treats apart; spacing by the
       width alone would stack the tall ones into each other. */
    const ink = Math.max(art.ink || 1, art.inkH || art.ink || 1);
    /* Next to a pack, a loose treat that dwarfs the ten inside it reads
       wrong — the design draws the two about the same size. */
    const cap = g > 0 ? (innerArt * 2.2) / ink : Infinity;
    let looseArt = Math.min(art.size, cap);
    let perRow = 0;
    let rows = 0;
    /* A squarish block, the way the design lays them out — nine candies as
       3 x 3 rather than 4 + 4 + 1, which is both what the design shows and
       easier to count. Wider only when the room beside the packs forces it. */
    const want = Math.ceil(Math.sqrt(stage.loose));
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const gapStep = looseArt * ink * 1.16;
      const fits = Math.max(1, Math.floor(room / gapStep));
      perRow = Math.min(fits, Math.max(1, want));
      rows = Math.ceil(stage.loose / perRow);
      if (rows * gapStep <= YARD.h && perRow * gapStep <= room) break;
      looseArt *= 0.9;                    // too tall or too wide: come down
    }

    const scale = looseArt / art.art;
    const step = looseArt * ink * 1.16;
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
  /* The shadow needs to know where the drawing's base is inside this box and
     how wide it is there — the box is 1254 square and the drawing sits in the
     middle of it, so neither is 100%. */
  el.style.setProperty('--ink', art.ink);
  el.style.setProperty('--inkh', art.inkH);
  el.style.setProperty('--idle-dur', (3200 + (i % 7) * 170) + 'ms');
  /* Wrapped: the delay is only there to keep neighbours out of step, and an
     unbounded one would leave the tenth treat in a pack waiting seconds
     before it first moved. */
  el.style.setProperty('--idle-delay', ((i % 7) * 330) + 'ms');

  /* First child, so it paints under the treat: the patch of floor it is
     standing on. */
  const shade = document.createElement('span');
  shade.className = 'treat__shade';
  el.appendChild(shade);

  const body = document.createElement('div');
  body.className = 'treat__body';

  const img = document.createElement('img');
  img.src = 'Assets/' + art.file;
  img.alt = '';
  body.appendChild(img);

  /* Two eyelids, each a patch of the treat's own skin copied over its eye. */
  if (art.eyes) {
    el.style.setProperty('--blink-dur', (3900 + (i % 5) * 260) + 'ms');
    el.style.setProperty('--blink-delay', ((i % 5) * 620) + 'ms');
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
      /* Copying skin only works where there is a clean patch of it to copy.
         The strawberry has leaves right above its eyes and runs out of fruit
         below, so it names its skin colour instead and the lid paints that. */
      const skin = art.eyes.fill
        // Rounded and shaded, or the flat patch reads as a pasted rectangle.
        ? 'background-image:' + art.eyes.fill + ';border-radius:44% / 38%;' +
          (art.eyes.fillSize
            ? 'background-size:' + art.eyes.fillSize + ';background-repeat:repeat;'
            : '')
        : 'background-image:url("Assets/' + art.file + '");' +
          'background-size:' + art.canvas[0] + 'px ' + art.canvas[1] + 'px;' +
          'background-position:' + -(ex - sx) + 'px ' + -(ey - sy) + 'px';
      lid.style.cssText =
        'left:' + ex + 'px;top:' + ey + 'px;width:' + ew + 'px;height:' + eh + 'px;' +
        'border-bottom-width:' + Math.max(2, eh * 0.13).toFixed(1) + 'px;' + skin;
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

    const pshade = document.createElement('span');
    pshade.className = 'pack__shade';
    pack.appendChild(pshade);

    if (item.packet) {
      const packet = PACKETS[item.packet];
      const img = document.createElement('img');
      img.className = 'pack__art';
      img.src = 'Assets/' + packet.file;
      img.alt = '';
      pack.appendChild(img);

      /* Ten cells, each a crop of this same packet over one of its treats.
         Invisible at rest — the crop sits exactly over the artwork it was cut
         from — and pops when its number is counted.

         Each crop is grown past its share of the grid by PACK_CELL_PAD. A
         treat is drawn very nearly as wide as its cell, so a crop of exactly
         one fifth sliced the sides off every one of them, and the flat edge
         was plain the moment the cell lifted. The overspill takes in a sliver
         of the neighbours, which is what the feathered edge in the stylesheet
         is for. */
      const k = item.w / packet.size[0];
      const [gx, gy, gw, gh] = packet.grid;
      const cw = (gw / 5) * k;
      const chh = (gh / 2) * k;
      const padX = cw * PACK_CELL_PAD;
      const padY = chh * PACK_CELL_PAD;
      item.members = [];
      for (let n = 0; n < 10; n += 1) {
        const cx = (gx + (n % 5) * (gw / 5)) * k - padX;
        const cy = (gy + Math.floor(n / 5) * (gh / 2)) * k - padY;
        const cell = document.createElement('span');
        cell.className = 'pack__cell';
        cell.style.cssText =
          'left:' + cx + 'px;top:' + cy + 'px;' +
          'width:' + (cw + padX * 2) + 'px;height:' + (chh + padY * 2) + 'px;' +
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

/* Staggered pop-in across the yard.

   `instant` skips it. A stage the camera pans to is built while the room is
   off frame, and the treats are put on the table there — so the camera glides
   onto a table that already has its jar and its treats on it, the way a camera
   moving across a room finds what is in it. Popping them in during the move
   smeared them; popping them in after it landed made the table look like it
   had always been that way. Neither is the move doing the revealing. */
function revealTreats(instant) {
  state.items.forEach((item, i) => {
    const settle = () => {
      item.el.classList.remove('treat--in', 'pack--in');
      if (item.kind === 'loose') item.el.classList.add('treat--idle');
      else if (item.members) {
        item.members.forEach((m) => m.el.classList.add('treat--idle'));
      }
    };

    if (instant) {
      item.el.classList.remove('treat--waiting', 'pack--waiting');
      settle();
      return;
    }

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

    const rect = plateRect(key.plate);
    btn.style.setProperty('--kx', rect.x - KEYPAD_ORIGIN.x);
    btn.style.setProperty('--ky', rect.y - KEYPAD_ORIGIN.y);
    btn.style.setProperty('--kw', rect.w);
    btn.style.setProperty('--kh', rect.h);
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
  /* The key cue pitched well down: a digit going in and a digit coming back out
     should be the same sound heard in opposite directions. The back key had no
     sound at all. */
  playSfx('key', 0.66);
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

      /* Judging the answer disables every key (`restrictKeys([])`), so they
         have to be handed back before the next try — otherwise one wrong
         answer leaves the pad dead. A guided stage goes back to pointing at
         the digit it is due; the child's turn gets the whole pad again. Keys
         first, then unlock: the pad should never look live while every key on
         it is dead. */
      if (state.expect) pointAtExpected();   // guided: back to the first digit
      else restrictKeys(null);                // the child's turn: whole pad
      unlockKeypad();

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
/* The jar is 573 x 835 at (1242, 192) — its own proportions, centred where the
   650-wide jar it replaces was centred. */
/* The design measured its packed jars against a jar 650 wide. This one is 573,
   the same height but relatively narrower, so a heap that filled the old jar's
   width overhangs this one — by about 40px each side, which my clip then sliced
   flat off the outer treats.

   The arrangement is the design's and worth keeping, so it is mapped onto the
   new jar rather than trimmed: everything scales by 573/650 about the jar's
   centre line and its floor, so the heap keeps its shape, still rests on the
   bottom, and comes in inside the glass. */
const JAR_FIT = {
  k: 573 / 650,
  /* The slots below were already shifted onto the 650-wide jar's centre line,
     so the centre does not move — only the width scales. `fromFloor` is where
     that heap came to rest; `toFloor` is the new glass floor, less a little. */
  fromX: 1529, fromFloor: 973,
  toX: 1529, toFloor: 925
};

function fitToJar(x, y) {
  return { x: JAR_FIT.toX + (x - JAR_FIT.fromX) * JAR_FIT.k,
           y: JAR_FIT.toFloor + (y - JAR_FIT.fromFloor) * JAR_FIT.k };
}

/* Nothing may hang out of the jar. The design draws its heaps pressing against
   the glass, and after the fit above one stage's packets still reached past the
   right wall. So the whole arrangement steps down about the jar's centre line
   and floor until it is inside — the composition is kept and shrunk, rather
   than the outliers being trimmed off, which is what the clip used to do.

   The box is the jar's body rather than its inside: a treat touching the glass
   is how the design draws them. */
const JAR_BODY = { left: 1252, right: 1805, top: 384, bottom: 1000 };

function shrinkToFit(rest, items, art, aspect) {
  const boxOf = (to, item) => {
    const w = item.kind === 'pack' ? to.w : to.s * art.ink;
    const h = item.kind === 'pack' ? to.w / aspect : to.s * art.inkH;
    return [to.x - w / 2, to.y - h / 2, to.x + w / 2, to.y + h / 2];
  };
  const at = (f) => rest.map((to) => ({
    x: JAR_FIT.toX + (to.x - JAR_FIT.toX) * f,
    y: JAR_FIT.toFloor + (to.y - JAR_FIT.toFloor) * f,
    spin: to.spin,
    s: to.s === undefined ? undefined : to.s * f,
    w: to.w === undefined ? undefined : to.w * f
  }));

  for (let step = 0; step <= 14; step += 1) {
    const f = 1 - step * 0.02;
    const tried = at(f);
    let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
    tried.forEach((to, i) => {
      const q = boxOf(to, items[i]);
      l = Math.min(l, q[0]); t = Math.min(t, q[1]);
      r = Math.max(r, q[2]); b = Math.max(b, q[3]);
    });
    if (l >= JAR_BODY.left && r <= JAR_BODY.right
        && t >= JAR_BODY.top && b <= JAR_BODY.bottom) {
      state.jarShrink = f;
      return tried;
    }
  }
  state.jarShrink = 0.72;
  return at(0.72);
}

/* What the jar looks like once everything is in, taken from the design's own
   packed frame for each stage: where each thing sits, how far it is tilted, and
   the size its art is drawn at.

   Figma reports these as a post-rotation bounding box plus a rotation, so the
   box centre is the visual centre and the art's own side comes back from the
   box: a square of side s tilted by t has a box of s*(|cos t| + |sin t|).
   Loose treats carry `s`, the 1254 px canvas to draw the treat at; packs carry
   `w`, the packet art's width.

   The design fills each jar right up for the picture, so most frames hold more
   treats than the stage actually counts (32 jellies where the answer is 15).
   The count has to stay honest, so the engine takes the lowest slots first and
   leaves the rest — the pile keeps the design's sizes, tilts and placement, at
   the number of things the child is being asked to count.

   Level 2 is the exception: the marshmallow frame is the one packed screen
   whose node could not be found in the file, so its four packets and two loose
   treats are authored here in the same idiom.
   ------------------------------------------------------------ */
const JAR_LAYOUT = {
  tutorial: {
    packs: [],
    loose: [
      { cx: 1566.4, cy: 851.4, s: 315.5, rot: -9.0 },
      { cx: 1349.7, cy: 827.9, s: 280.8, rot: -26.4 },
      { cx: 1713.5, cy: 755.5, s: 283.5, rot: -22.0 },
      { cx: 1558.2, cy: 703.9, s: 288.7, rot: 4.5 },
      { cx: 1385.6, cy: 689.2, s: 296.1, rot: -35.0 },
      { cx: 1558.5, cy: 607.5, s: 283.5, rot: -22.0 }
    ]
  },
  level1: {
    packs: [],
    loose: [
      { cx: 1461.4, cy: 891.4, s: 259.0, rot: 156.5 },
      { cx: 1660.9, cy: 880.8, s: 259.0, rot: -35.9 },
      { cx: 1560.4, cy: 851.4, s: 259.1, rot: 28.2 },
      { cx: 1362.1, cy: 824.2, s: 259.0, rot: -75.2 },
      { cx: 1520.2, cy: 824.2, s: 259.0, rot: -139.4 },
      { cx: 1565.9, cy: 749.8, s: 259.0, rot: 19.5 },
      { cx: 1425.7, cy: 743.7, s: 259.1, rot: 92.4 },
      { cx: 1702.8, cy: 743.7, s: 259.1, rot: 74.9 },
      { cx: 1346.5, cy: 685.5, s: 259.0, rot: 130.3 },
      { cx: 1519.9, cy: 633.8, s: 258.9, rot: -174.3 },
      { cx: 1731.0, cy: 593.0, s: 259.0, rot: 47.4 },
      { cx: 1631.9, cy: 590.9, s: 258.9, rot: -118.9 },
      { cx: 1326.7, cy: 588.8, s: 258.9, rot: -63.5 },
      { cx: 1493.4, cy: 561.4, s: 259.0, rot: -8.0 }
    ]
  },
  transition1: {
    packs: [
      { cx: 1519.5, cy: 685.5, w: 527.7, rot: -39.4 }
    ],
    loose: [
      { cx: 1538.8, cy: 923.8, s: 102.8, rot: 126.0 },
      { cx: 1585.7, cy: 923.7, s: 102.8, rot: 23.6 },
      { cx: 1463.4, cy: 914.4, s: 102.8, rot: -19.1 },
      { cx: 1668.8, cy: 902.8, s: 102.8, rot: 126.0 },
      { cx: 1396.3, cy: 899.3, s: 102.8, rot: -81.7 },
      { cx: 1509.1, cy: 879.1, s: 102.8, rot: 74.8 },
      { cx: 1310.8, cy: 866.8, s: 102.8, rot: 126.0 },
      { cx: 1366.4, cy: 856.4, s: 102.8, rot: -19.1 },
      { cx: 1571.8, cy: 848.8, s: 102.8, rot: 177.2 },
      { cx: 1698.1, cy: 834.1, s: 102.8, rot: 74.8 },
      { cx: 1518.4, cy: 825.4, s: 102.8, rot: 2.2 },
      { cx: 1677.0, cy: 810, s: 174.0, rot: 0 },
      { cx: 1647.1, cy: 808.1, s: 102.8, rot: 74.8 },
      { cx: 1313.0, cy: 777.0, s: 102.8, rot: 22.1 },
      { cx: 1737.8, cy: 765.8, s: 102.8, rot: 126.0 },
      { cx: 1541.1, cy: 759.1, s: 102.8, rot: 74.8 },
      { cx: 1674.1, cy: 753.1, s: 102.8, rot: 74.8 },
      { cx: 1389.9, cy: 750.9, s: 102.8, rot: -29.1 },
      { cx: 1611.4, cy: 734.4, s: 102.8, rot: -30.5 },
      { cx: 1483.1, cy: 717.1, s: 102.8, rot: 74.8 },
      { cx: 1673.1, cy: 696.1, s: 102.8, rot: 74.8 },
      { cx: 1389.1, cy: 685.1, s: 102.8, rot: 74.8 },
      { cx: 1292.1, cy: 681.1, s: 102.8, rot: 74.8 },
      { cx: 1341.0, cy: 664, s: 174.0, rot: 0 },
      { cx: 1362.1, cy: 633.1, s: 102.8, rot: 74.8 },
      { cx: 1538.0, cy: 628.0, s: 102.8, rot: -131.5 },
      { cx: 1445.0, cy: 609.0, s: 102.8, rot: 175.8 },
      { cx: 1660.1, cy: 582.1, s: 102.8, rot: 74.8 },
      { cx: 1524.6, cy: 536.6, s: 102.8, rot: -132.9 },
      { cx: 1590.5, cy: 533.5, s: 102.8, rot: 124.6 },
      { cx: 1458.0, cy: 491.0, s: 102.8, rot: 73.4 },
      { cx: 1688.9, cy: 463.4, s: 102.8, rot: -80.3 }
    ]
  },
  transition2: {
    packs: [
      { cx: 1634.2, cy: 855.0, w: 290.0, rot: -29.2 },
      { cx: 1423.8, cy: 858.8, w: 290.0, rot: 5.7 }
    ],
    loose: [
      { cx: 1431.1, cy: 897.3, s: 156.0, rot: 118.8 },
      { cx: 1678.7, cy: 895.7, s: 156.0, rot: -96.8 },
      { cx: 1542.4, cy: 807.4, s: 156.0, rot: -169.0 },
      { cx: 1750.4, cy: 795.4, s: 156.0, rot: -24.7 },
      { cx: 1404.3, cy: 793.3, s: 156.0, rot: 46.6 },
      { cx: 1297.0, cy: 787.0, s: 156.0, rot: -25.5 },
      { cx: 1655.2, cy: 756.2, s: 156.0, rot: 47.5 },
      { cx: 1587.4, cy: 745.4, s: 156.0, rot: 83.8 },
      { cx: 1473.4, cy: 733.4, s: 156.0, rot: 119.7 },
      { cx: 1702.2, cy: 725.2, s: 156.0, rot: 47.8 },
      { cx: 1359.4, cy: 721.4, s: 156.0, rot: 119.7 },
      { cx: 1534.1, cy: 680.1, s: 156.0, rot: -24.1 },
      { cx: 1636.7, cy: 666.7, s: 156.0, rot: -96.0 },
      { cx: 1408.4, cy: 659.4, s: 156.0, rot: 11.8 },
      { cx: 1756.2, cy: 653.2, s: 156.0, rot: -131.9 },
      { cx: 1296.5, cy: 649.5, s: 156.0, rot: -60.0 },
      { cx: 1473.6, cy: 625.6, s: 156.0, rot: -167.9 },
      { cx: 1616.4, cy: 592.4, s: 156.0, rot: 84.2 },
      { cx: 1355.9, cy: 574.9, s: 156.0, rot: 156.2 },
      { cx: 1728.1, cy: 573.1, s: 156.0, rot: 48.3 },
      { cx: 1494.6, cy: 564.6, s: 156.0, rot: 120.2 },
      { cx: 1293.9, cy: 528.9, s: 156.0, rot: 12.3 },
      { cx: 1407.7, cy: 524.7, s: 156.0, rot: -23.6 }
    ]
  },
  level2: {
    packs: [
      { cx: 1480.0, cy: 795, w: 476.4, rot: 7.5 },
      { cx: 1557.0, cy: 706, w: 476.4, rot: -13.0 },
      { cx: 1484.0, cy: 624, w: 476.4, rot: 5.5 },
      { cx: 1547.0, cy: 543, w: 476.4, rot: -9.5 }
    ],
    loose: [
      { cx: 1361.0, cy: 884, s: 230.0, rot: -17.0 },
      { cx: 1680.0, cy: 866, s: 230.0, rot: 23.0 }
    ]
  },
  level3: {
    packs: [
      { cx: 1454.4, cy: 660.5, w: 476.4, rot: -51.5 },
      { cx: 1636.9, cy: 690.6, w: 476.4, rot: -77.5 },
      { cx: 1473.2, cy: 714.3, w: 476.4, rot: -103.6 },
      { cx: 1502.2, cy: 669.6, w: 476.4, rot: -129.7 },
      { cx: 1500.5, cy: 767.7, w: 476.4, rot: -13.8 }
    ],
    loose: []
  },
  level4: {
    packs: [
      { cx: 1556.0, cy: 807.9, w: 318.8, rot: 38.5 },
      { cx: 1642.7, cy: 755.9, w: 318.8, rot: 100.8 },
      { cx: 1364.7, cy: 600.9, w: 318.8, rot: 100.8 },
      { cx: 1513.6, cy: 649.6, w: 318.8, rot: 64.7 },
      { cx: 1629.7, cy: 628.7, w: 318.8, rot: 28.7 },
      { cx: 1630.1, cy: 515.8, w: 318.8, rot: -7.4 },
      { cx: 1416.9, cy: 801.7, w: 318.8, rot: 10.8 }
    ],
    loose: [
      { cx: 1493.9, cy: 946.9, s: 112.4, rot: 97.2 },
      { cx: 1549.0, cy: 921.0, s: 112.4, rot: 66.4 },
      { cx: 1421.6, cy: 916.6, s: 112.4, rot: 81.8 },
      { cx: 1649.0, cy: 915.0, s: 112.4, rot: 66.4 },
      { cx: 1354.0, cy: 906.0, s: 112.4, rot: 66.4 },
      { cx: 1298.1, cy: 885.1, s: 112.4, rot: 51.0 },
      { cx: 1726.0, cy: 868.0, s: 112.4, rot: -177.1 },
      { cx: 1748.4, cy: 776.4, s: 112.4, rot: -138.2 },
      { cx: 1271.0, cy: 742.0, s: 112.4, rot: 105.2 },
      { cx: 1382.5, cy: 690.5, s: 112.4, rot: 144.1 },
      { cx: 1723.0, cy: 621.0, s: 112.4, rot: 56.0 },
      { cx: 1282.6, cy: 600.6, s: 112.4, rot: -99.4 },
      { cx: 1764.3, cy: 532.3, s: 112.4, rot: 17.2 },
      { cx: 1304.0, cy: 484.0, s: 112.4, rot: -21.7 },
      { cx: 1459.6, cy: 453.6, s: 112.4, rot: -60.5 }
    ]
  }
};

/* The new jar's glass, measured off `Jar.png` (522 x 761 drawn 573 x 835 at
   1242, 192): the wall is thinner than the old jar's, so the inside comes out
   within a few pixels of where it was and the packed arrangements below still
   land where the design put them. */
const JAR_INSIDE = { left: 1281, right: 1777, top: 401, floorY: 930 };

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
    // Area budget goes by the drawing, not by the transparent square.
    w: art.size * (art.ink || 1), h: art.size * (art.ink || 1)
  })));

  if (!items.length) return WIN.flyDur;

  /* The design lays every stage's jar out by hand, so use its slots. Packs
     take the design's pack slots in order; loose treats take the lowest slots
     it offers, because the design draws more of them than the stage counts. */
  const laid = JAR_LAYOUT[currentStage().id];
  const useDesign = !!laid
    && laid.packs.length >= packs.length
    && laid.loose.length >= loose.length;

  const scale = useDesign ? 1 : jarScale(items);
  let rest;
  if (useDesign) {
    const slots = laid.packs.slice(0, packs.length)
      .concat(laid.loose.slice(0, loose.length));
    rest = slots.map((slot) => {
      const f = fitToJar(slot.cx, slot.cy);
      return { x: f.x, y: f.y, spin: slot.rot,
               s: slot.s === undefined ? undefined : slot.s * JAR_FIT.k,
               w: slot.w === undefined ? undefined : slot.w * JAR_FIT.k };
    });
    const packet = currentStage().packet ? PACKETS[currentStage().packet] : null;
    rest = shrinkToFit(rest, items, art,
                       packet ? packet.size[0] / packet.size[1] : PACK_ASPECT);
  } else {
    rest = scatterInJar(items, scale);
  }

  items.forEach((item, i) => {
    const to = rest[i];
    if (item.pack && item.pack.members) {
      item.pack.members.forEach((m) => m.el.classList.remove('treat--idle'));
    }
    item.el.classList.remove('treat--idle');

    // `treat-fly` ends on --spin x 1.7, so aim it at the tilt we want.
    /* A design slot says exactly how big to draw it. `--land` scales the
       image's own pixels, so a treat's slot divides by the 1254 canvas and a
       pack's by its packet art's width. */
    let land;
    if (item.kind === 'pack' && to.w !== undefined) land = to.w / item.w;
    else if (to.s !== undefined) land = to.s / art.canvas[0];
    else land = item.kind === 'pack' ? scale : (art.size * scale) / art.art;
    flyOne(item.el, item.from, to, land, i, to.spin / 1.7);
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

/* The room tone. Browsers will not start audio before the page has been
   touched, so this is armed on the first interaction rather than at load, and
   fades in — a bed that starts at full level announces itself. */
let roomTone = null;

function startRoomTone() {
  if (roomTone || !SFX.enabled) return;
  // encodeURI: the supplied filename has spaces in it.
  roomTone = new Audio(encodeURI(SFX.dir + SFX.bed.file));
  roomTone.loop = true;
  roomTone.volume = 0;
  const played = roomTone.play();
  if (played && played.catch) played.catch(() => { roomTone = null; });

  const target = SFX.bed.volume;
  const step = () => {
    if (!roomTone) return;
    roomTone.volume = Math.min(target, roomTone.volume + target / 40);
    if (roomTone.volume < target) setTimeout(step, 90);
  };
  setTimeout(step, 200);
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
  const given = (hooks && hooks.onEnd) || null;
  const word = numWord(n);

  /* Counting holds the idle countdown the same way a spoken line does. */
  holdAwake();
  let let_go = false;
  const onEnd = () => {
    if (let_go) return;
    let_go = true;
    releaseAwake();
    if (given) given();
  };

  if (!voiceReady()) {
    if (onStart) onStart();
    setTimeout(onEnd, 380);
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
  startRoomTone();          // the same first touch is what lets audio start
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
const OST_SIZE = { max: 56, min: 30, step: 2, width: 926, height: 105 };

/* Puts a line on the plate at the largest size that fits it. Short lines get
   the design's 56 px; a long one steps down, and wraps onto a second row if it
   still will not fit on one. Level 1's line is 84 characters — at any readable
   size on a single row it runs clean off the plate. */
function showOst(line, done) {
  wakeUp();                     // a line on the plate means the screen is busy
  const before = panelTyped.textContent;
  panelTyped.textContent = line;
  panelCaret.classList.remove('panel__caret--on');

  /* A new line sweeps in from the left. Counting is the exception: "1," grows
     into "1, 2," and re-sweeping the whole run on every number would make the
     numbers already up there flicker, so an extension of the line on screen
     just appears. */
  if (!before || line.indexOf(before) !== 0) {
    panelText.classList.remove('panel__text--wipe');
    void panelText.offsetWidth;            // restart the sweep
    panelText.classList.add('panel__text--wipe');
  }

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
/* `quiet` is for the lines the script marks (VO): spoken, never written up.
   Everything else goes on the plate as Agni starts it, so the two cannot
   drift apart. */
function say(line, done, quiet) {
  stage.dispatchEvent(new CustomEvent('vo', { detail: { line } }));
  const show = () => { if (!quiet) showOst(line); };

  holdAwake();
  let let_go = false;
  const finish = () => {
    if (let_go) return;             // onend and the stall guard both land here
    let_go = true;
    releaseAwake();
    if (done) done();
  };

  if (!voiceReady()) {
    show();
    setTimeout(finish, line.length * VO.charMs + 300);
    return;
  }
  speakLine(line, finish, show);
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
  /* The ten light up one at a time as they are counted. When the count is done
     they go out and the packet lights up instead — the attention moves from the
     treats to the bag they make up, which is the point being taught. Left as it
     was, ten lit treats inside a lit packet came out as one bright yellow
     rectangle with nothing to read in it. */
  countSequence(pack.members.map((m) => m.el), from, () => {
    pack.members.forEach((m) => m.el.classList.remove('treat--glow'));
    pack.el.classList.add('pack--marked');
    done();
  });
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

/* Unlocking with an empty allow-list would leave the pad looking live while
   every key is dead — briefly, but long enough for a quick tap to vanish. The
   caller that opens the pad and the caller that says which keys may respond are
   not the same, and they do not fire together, so this waits for the second
   one. */
function unlockKeypad() {
  if (state.allowed && !state.allowed.length) return;
  state.locked = false;
  keysLayer.classList.remove('is-locked');
}

/* ------------------------------------------------------------
   The pad opens on a tap of the answer panel
   ------------------------------------------------------------ */
function shutKeypad() {
  keypadPlates.classList.add('keypad--closed');
  keysLayer.classList.add('keys--closed', 'is-locked');
  answerPanel.classList.add('answer--waiting');
  state.locked = true;
  /* A shut pad responds to nothing, and saying so here is what stops the last
     stage's restriction leaking into the next one: the tutorial ends with only
     the 6 clickable, and Level 1 used to open with that still in force. */
  restrictKeys([]);
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
    if (step.vo) say(step.vo, null, step.voOnly);
    return;
  }
  if (step.awaitTap) { awaitChildTap(); return; }
  if (step.vo) { say(step.vo, next, step.voOnly); return; }
  next();
}

/* ------------------------------------------------------------
   Guided: the hand taps the panel, then walks the digits
   ------------------------------------------------------------ */
function nudgeToPanel(done) {
  /* The hand shows where to tap; the child is the one who taps it. The pad
     stays shut until they do — in the tutorial as much as anywhere, since
     watching the hand open it teaches nothing about opening it yourself. */
  handPointAt(ANSWER_CENTRE.x, ANSWER_CENTRE.y);
  awaitChildTap(done);
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
   Dozing

   The treats hold still while anything is going on — while Agni is talking,
   while they are being counted, while the child is tapping. Ten seconds with
   nothing happening and they start breathing and blinking again, which is the
   screen asking to be touched rather than decoration competing with the
   lesson.

   "Something going on" is both the child's input and the game's own voice, so
   showOst() pokes this too: a stage that is mid-sentence is not idle.
   ------------------------------------------------------------ */
function wakeUp() {
  stage.classList.remove('stage--sleepy');
  if (state.sleepyTimer) clearTimeout(state.sleepyTimer);
  state.sleepyTimer = null;
  /* Still talking, or counting: the ten seconds have not begun. A line longer
     than the window would otherwise set the treats blinking mid-sentence. */
  if (state.talking) return;
  state.sleepyTimer = setTimeout(() => stage.classList.add('stage--sleepy'),
                                 SLEEPY_MS);
}

/* Held while Agni has something to say, and released when he stops — which is
   when the idle countdown is allowed to start. Counted rather than a flag:
   counting a group queues a number at a time, and they overlap. */
function holdAwake() {
  state.talking += 1;
  wakeUp();
}

function releaseAwake() {
  state.talking = Math.max(0, state.talking - 1);
  if (!state.talking) wakeUp();     // quiet now: start the ten seconds
}

['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'].forEach((name) => {
  window.addEventListener(name, wakeUp, { passive: true });
});

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
    handPointAt(ANSWER_CENTRE.x, ANSWER_CENTRE.y);
  }, IDLE_NUDGE_MS);
}

function awaitChildTap(then) {
  displayHit.hidden = false;
  displayPanel.classList.add('display--hint');
  armIdleNudge();

  const onTap = () => {
    clearIdleTimer();
    handHide();
    answerPanel.classList.remove('answer--wiggle');
    openKeypad();
    setTimeout(() => {
      // Guided stages carry on with the hand walking the digits; on the
      // child's own turn the whole pad simply comes live.
      if (then) { then(); return; }
      state.expect = null;              // the child chooses freely
      restrictKeys(null);
      unlockKeypad();                   // now that a key can actually respond
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
/* `reveal` is how the treats are put on the table, for the camera's sake:

     after    ms to wait before they appear (default: a short beat)
     instant  already there rather than popping in one at a time
     talkAfter  ms to wait before Agni starts — a panned stage holds until the
                camera has landed, so the lesson does not begin off frame

   A stage the camera pans to sets all three: the treats go down while the room
   is off frame, and the talking waits for the camera. */
function startStage(index, reveal) {
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
  /* The stage's own line is skipped when the first thing Agni says is going to
     replace it — which is what put "Count the Treats Together" on screen at the
     start only to swap it for "Let us count these treats together" a moment
     later. The two say the same thing, and the spoken one is the one that
     belongs to the moment. It is still the line the plate falls back to while
     the child is thinking, and after a wrong answer. */
  const opener = (stg.steps || [])[0];
  if (!(opener && opener.vo && !opener.voOnly)) showOst(stg.ost.main);
  stage.dispatchEvent(new CustomEvent('stagestart', { detail: { id: stg.id, index } }));

  const r = reveal || {};
  const wait = r.after === undefined ? FLOW.reveal : r.after;
  const talk = r.talkAfter === undefined ? wait : r.talkAfter;
  setTimeout(() => revealTreats(r.instant), wait);
  setTimeout(() => runSteps(stg.steps, 0), talk + FLOW.afterOst);
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
    /* Off frame: the table is set complete — jar and treats both — so the
       camera has something to arrive at. Agni waits for it to land. */
    startStage(index, { after: 0, instant: true, talkAfter: CAM.settle });
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
function playIntro(alreadyHere) {
  state.locked = true;
  restrictKeys([]);

  if (reduceMotion) {
    agniStand.classList.remove('agni-stand--waiting');
    panelPlate.classList.remove('panel__plate--closed');
    startStage(0);
    return;
  }

  panelPlate.classList.add('panel__plate--closed');

  /* `alreadyHere` is the opening: he is crossing the room under his own
     animation, so there is no fly-in to run. He is left visible on the plate
     rather than hidden until the sheet clears, and that is deliberate: the
     plate layer is a crop of the panel asset from the asset's own plate edge,
     which the dragon overlaps — so hiding `.agni-stand` does not hide him, it
     leaves the right half of him drawn by the plate underneath. Half a dragon
     is worse than two, and the panel is part of the screen being uncovered
     anyway. */
  if (!alreadyHere) {
    agniStand.classList.add('agni-stand--waiting');
    agni.classList.add('agni--in', 'agni--flying');
    playSfx('agniFly');          // wingbeats under the flight
    setTimeout(() => {
      agniStand.classList.remove('agni-stand--waiting');
      agni.classList.remove('agni--flying');
    }, INTRO.landAt);
  } else {
    agniStand.classList.remove('agni-stand--waiting');
  }

  /* With no flight to wait out, the plate unrolls almost at once — otherwise
     the reveal is followed by a second of nothing. */
  const panelAt = alreadyHere ? 300 : INTRO.panelAt;
  setTimeout(() => {
    panelPlate.classList.remove('panel__plate--closed');
    panelPlate.classList.add('panel__plate--open');
    playSfx('panelOpen');
  }, panelAt);

  setTimeout(() => startStage(0), panelAt + (INTRO.typeAt - INTRO.panelAt));
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
  shutKeypad();            // and the state agrees with the markup
  paintDisplay();
  displayHit.hidden = true;
  bindKeypad();
  bindKeyboard();
  loadSfx();
  initVoice();
  awaitStart();
}

/* Nothing starts until the page has been touched once.

   Not a preference: a browser refuses to play audio before then, and every cue
   in the intro came back NotAllowedError — Agni's wingbeats, the panel opening,
   the counting. The same gesture is what lets his voice speak. One tap buys all
   of it, and it is the ordinary way a game with sound opens. */
function awaitStart() {
  const go = () => {
    begin.hidden = true;
    unlockVoice();          // music, and speech is allowed from here
    if (reduceMotion) { playIntro(); return; }
    openWithFold();
  };
  begin.addEventListener('click', go, { once: true });
}

/* The opening: the page's corner turns over and the room is uncovered under it.

   The treats go out at once, under the sheet, because they are what the fold has
   to uncover — with an empty room underneath there is nothing to reveal.

   The panel does not, and nothing is said, until the fold has finished. A line
   arriving while the page is still turning is a line nobody reads, and the plate
   unrolling behind a moving crease is two animations fighting for the same
   attention. `talkAfter` is what holds the lesson back; `.stage--folding` holds
   the plate. */
function openWithFold() {
  state.locked = true;
  restrictKeys([]);
  stage.classList.add('stage--folding');
  panelPlate.classList.add('panel__plate--closed');
  agniStand.classList.add('agni-stand--waiting');

  cross.classList.add('cross--on');
  playSfx('agniFly');
  startStage(0, { after: 0, instant: true, talkAfter: INTRO.crossing });

  setTimeout(() => {
    cross.classList.remove('cross--on');
    stage.classList.remove('stage--folding');
    agniStand.classList.remove('agni-stand--waiting');
    panelPlate.classList.remove('panel__plate--closed');
    panelPlate.classList.add('panel__plate--open');
    playSfx('panelOpen');
  }, INTRO.crossing);
}





init();
