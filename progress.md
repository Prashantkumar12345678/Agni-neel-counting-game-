# Agni & Nil — Counting Game · Progress

Implementation of **screen 1** of the *nil-and-agni-count-game* design.

- **Figma file:** [nil-and-agni-count-game](https://www.figma.com/design/z7HmkJnmFbWKXqBR4NlHkQ/nil-and-agni-count-game?node-id=190-494&m=dev)
- **Section:** `190:494` — *Game screens*
- **Screens built:** `190:495` ("1") and `267:137` ("5", the pad open) — the
  design was **redesigned** partway through: jar, keypad, answer plate and
  submit all smaller, digits on a new grid, treats much bigger and tilted.
- **Design canvas:** 1920 × 1080 (fixed), uniformly scaled to fit the viewport
- **Stack:** plain HTML + CSS + JS. No build step, no dependencies — open `index.html`.

---

## 🎮 The game — the whole Tutorial Gameplay section

Built to the **Tutorial Gameplay** section of the week-1 script
(`Saifur_Week1 - Script`), column by column: VO, OST, Visuals, Interaction.
All seven stages, in order, in one continuous run.

| # | Stage | On the yard | Answer | Whose turn |
| --- | --- | --- | --- | --- |
| 1 | Tutorial | 6 loose | **6** | Guided — hand nudge walks it through |
| 2 | Level 1 | 9 loose | **9** | The child, with hints |
| 3 | Transition 1 | 1 group of 10 + 5 loose | **15** | Guided |
| 4 | Transition 2 | 2 groups of 10 + 7 loose | **27** | Guided |
| 5 | Level 2 | 4 groups of 10 + 2 loose | **42** | The child, with hints |
| 6 | Level 3 | 5 groups of 10 | **50** | The child, with hints |
| 7 | Level 4 | 7 groups of 10 + 9 loose | **79** | The child, with hints |

Every stage puts **exactly** its count on screen — 6, 9, 15, 27, 42, 50, 79 —
verified by counting rendered treats, because the count *is* the puzzle.

Stages live in the `STAGES` table in [script.js](script.js): the treats, the
answer, the OST lines, the VO lines, the hints, and a list of **steps**. A step
speaks a line, changes the on-screen text, counts something, or hands over to
the child. `runSteps()` walks the list; steps that hand over end the chain,
and the child's tap moves it on.

### The redesign

Re-measured from frame `267:137`. **Every asset file was unchanged** — all five
compared byte for byte — so only the layout moved:

| Element | Before | Now |
| --- | --- | --- |
| Jar | 1113,184 · 697×895 | **1144,192 · 650×835** |
| Keypad | 1161,511 · 579×455 | **1200,523 · 503×395** |
| Answer plate | 1260,358 · 417×156 | **1274,368 · 391×146** |
| Submit | 1541,855.68 · 193×112.32 | **1531,820.08 · 166×97.92** |

The pad turns out to be a clean 3 × 4 grid — 503 × 395 divides into cells of
167.67 × 98.75, and the design's digits sit on exactly those centres — so the
hit areas are derived from the grid rather than from hand-measured plate
positions. Checked with an outline overlay: every cell frames one key.

The jar's interior, the mouth, the gate and the cap were all scaled with the
jar (it is 0.93 of its old size).

**The treats are 280 px squares, each tilted**, read off the design's *render*
rather than the node boxes — Figma reports a rotated node's box before its
transform, so the file's coordinates do not give the visual centres.

**One asset did change: the apple.** The design uses a round-eyed apple, not the
slit-eyed, cobwebbed `green apple.svg` in the folder — added as
`green apple.png`, with its own eye boxes measured for the blink.

That exposed a sizing error of mine: `art` is the SVG's *rect*, but the visible
fruit is only 73-95% of it, and the fraction differs per asset. Sizes are now
set so the **visible** treat is about 205 px across on every stage — which is
what the design's apple measures.

### The art, per object

Each stage has its own treat, from the `ART` table in [script.js](script.js):

| Stage | Treat | Group of ten |
| --- | --- | --- |
| Tutorial | green apple | — |
| Level 1 | orange candy | — |
| Transition 1 | yellow jelly | `Yellow packet.png` |
| Transition 2 | strawberry | `stoberries packet.png` (a box) |
| Level 2 | marshmallow | `marsmalo packet.png` |
| Level 3 | blueberry | `bluberries packet.png` (1536 x 1024) |
| Level 4 | walnut | `walnuts packet.png` |

Every treat asset draws into the top-left of a larger canvas (the extra room is
its baked drop shadow), and each has **its own drawing size and its own display
size** — a walnut is smaller than an apple. Sizes live in `ART[key].size`.

The packet PNGs already contain their ten treats in a 5 × 2 grid, so a group of
ten is *one image*. Every stage with groups now has its own packet art.

**A treat inside a flat packet can still be counted on its own.** Each packet
carries a `grid` in `PACKETS`: the rectangle around its 5 × 2 of treats, in the
packet's own pixels. Ten cells are laid over it, each drawn as a *crop of that
same packet image*, exactly over its treat — invisible at rest, and when its
number is counted it pops and hops, so the treat looks like it jumps out of the
pack. Transition 1 needs exactly this (it counts 1–10 inside the group), and it
means no stage has to give up its packet art to be countable.

Those grids were measured by finding the treats' pupils and splitting them into
two rows. Two needed another route. The strawberry's *seeds* are dark, so it was
measured from the treats instead. The blueberry packet was measured from the
berries' own colour — profiling which columns and rows contain berry blue — but
the packet's blue *seals* match that colour too, so they had to be excluded by
measuring the rows only across the span the berries occupy.

**Loose treats stay big.** They are the things a five-year-old counts one by
one, so they are drawn at the object's own size and only shrink if they truly
will not fit beside the groups. Sizing them from the packet's inner treat size
made them specks.

**What lands in the jar looks dropped in, not arranged.** Positions are random
across the jar's width, the heap builds upward from the floor in flight order
(so it reads as things settling on what is already in there), every item gets
its own tilt, and they are z-ordered by depth so the front ones overlap the
back. Packs tilt less than single treats, being flatter.

**They are bigger because a heap overlaps.** The earlier sizing packed items
into a grid, so their combined area had to fit *inside* the jar and everything
came out tiny. The budget is now `JAR_PILE_AREA` — deliberately above 1 — so
the items can be drawn big enough to see while the jar still reads as
50-70% full. Nothing is ever drawn larger than it was on the table, and nothing
wider than 56% of the jar's inside.

**How high the heap builds follows the contents, not the jar.** Given every
stage the same pile height, six apples spread themselves up the middle of the
jar instead of sitting in a pile on the floor; the height now comes from how
many rows the items would need.

### Blinking

Every treat blinks. There is no closed-eye artwork, and these SVGs are not
vector — each is a single `<rect>` filled with an embedded PNG, so there is no
eye element to hide. Instead each lid paints **a patch of the treat's own skin**
over its eye, and draws a lash line along the bottom.

Where that patch comes from is per asset (`ART[key].eyes`), because it is not
always above: the strawberry has leaves above its eyes and runs out of fruit
below, so it takes cover from further up. Eye boxes were found by locating the
pupils (dark, reliable on every face) then growing into the eye white, bounded —
the marshmallow's body is white and joins its eyes, so unchecked growth swallows
the face. All seven were then checked by eye, open and closed.

### Guided stages vs the child's turn

**Guided** (tutorial, both transitions) — the hand nudge taps the jar, the pad
opens, then the hand points at each digit of the answer in turn and **only that
digit responds**: "hand nudge will appear on 4 and then 2". Agni's prompt plays
*over* the pointing, per the script's Interaction column.

**The child's turn** (levels 1–4) — Agni sets the task and then waits. After
**10 seconds of inactivity** the answer panel wiggles and the hand appears on
it, as the script asks. The child taps the jar and the pad opens with every key
live.

### Nothing is judged until the tick is pressed

The child types, looks at what they typed, fixes it with the delete key if they
want, and presses the green tick to check.

It used to be judged the instant the last digit landed, which was wrong three
ways: a four-year-old's mis-tap became a wrong answer immediately and **burned a
hint step**; the delete key was unreachable, because the check fired on the same
tap that completed the number; and on a two-digit answer the tick could only
ever be pressed with an *incomplete* number, so the one big green button in the
game could only ever produce a wrong answer.

On a guided stage the hand walks the digits and then **points at the tick**,
with only the tick live — so pressing it to check is taught rather than assumed.
On a level the whole pad stays live, which is where being able to review and
correct actually matters.

### Hints

The three-step ladder from the script, per level:

1. first wrong answer — *"Count again."* (or the grouping version)
2. second — the total spelled out: *"There are 4 groups of 10 and 2 more
   treats. That makes 42 treats altogether."*
3. third — *"This is the correct number."*, **and** the hand appears on the
   answer's digits with only those clickable, exactly as the guided stages do.

### Counting: ones and groups of ten

Two counting moves, both driven by the voice — the thing being counted lights
up on its number's `onStart`, and the next number waits for the last to finish:

- **Ones** — loose treats light one at a time (`countLoose`).
- **A whole group** — a pack of ten lights as one when its ten are spoken as a
  single number, "ten" then "twenty" (`countGroupTotal`). This is the grouping
  idea the transition screens teach.
- Transition 1 also counts *inside* a group, 1 to 10, one treat at a time
  (`countGroupItems`), before it is named as a group of ten.

### Moving between stages — the camera travels

Finishing a task pans the camera to the next jar rather than swapping the screen
underneath the child. Every scene layer lives in a `.world` element; the stage
around it stays put and keeps clipping. The world slides off one side (600 ms),
the next stage is built while it is out of frame, then it slides in from the
other and settles (760 ms).

**The table does not travel with the camera.** It sits outside the moving layer
and stays put, leaning in about 3.5% while the camera works. Panning the
background with everything else dragged the table out of frame and left a black
band at the edge — the void behind the scene. The table is the room; the camera
moves *across* it. A lean also cannot expose an edge, which any drift or
parallax on a background exactly the width of the frame always will.

Traced end to end: the world runs 0 → -1250, the stage swaps at 600 ms, then
1920 → 0 and settles. Checked for the black band by counting near-black columns
inside the frame across the whole travel: **zero**. Under reduced motion it cuts
straight across.

### Grouping without a border

There is no ring or tray around a group — a box drawn on top of the artwork read
as UI, not as part of the scene. So a group is shown by **spacing**, and a group
being taught is picked out with a **warm glow** (`filter: drop-shadow`) rather
than an outline.

That puts real weight on the gaps. Packet stages get 46 x 38 px, which is enough
because the packet art holds its own ten together. A group drawn as ten separate
treats gets **96 x 66** — Level 3 without that is fifty identical berries in a
grid with nothing to say where one ten ends and the next begins.

### Packs of ten

A group of ten is one `.pack` element holding ten treats, so it can glow, fly
and land as a single thing. Two details matter:

- **The tray is visible.** The script's treats come "in packs" and "in a box",
  and without a tray four or five groups touching read as one slab of treats
  rather than separate groups. The same element carries the amber teaching
  highlight.
- **There is a real gap between packs** (`max(20, pitch * 0.17)`). At the first
  attempt the trays were 10 px apart and Level 3's five groups looked like one
  block.

Treat size falls out of how many packs must fit, so seven packs and nine loose
still sit clear of the jar. Positions are the **centre** of the berry, and
`.treat` scales about that centre, so a scaled treat stays where it was put and
the layout maths never has to know the scale.

### Stage tokens

Every stage takes a token (`state.gen`); anything it schedules checks the token
before acting. Without this a pending timer from the stage just finishing
reaches into the next one — which is exactly how a group highlight from
Transition 2 ended up marking a pack on Level 2.

### Feedback rows

From the script's Feedback section:

- **Correct** — *"The spooky treats giggle and fly inside the jar. The lid
  closes."* + OST **"Jar Closed!"** + sparkle. The treats giggle in place first,
  then the board clears for the flight, the cap drops, the jar sparkles, and the
  panel comes back on its own carrying the closing line. Only the panel returns:
  bringing the whole board back drops the keypad in behind the packed jar.
- **Incorrect** — *"The spooky treats wiggle."* + OST **"Count/Try Again!"**,
  then the panel returns to the main line and the entry clears. Unreachable in
  the tutorial (only the 6 responds) but wired for the levels that follow.

The giggle and the wiggle both ride on the treat's **art**, like the counting
pop, so they never fight the idle rock on `.treat__body`.

### Sound effects

All cues come from **Kenney's Interface Sounds and Impact Sounds**, both
**CC0 / public domain** — free for any use, commercial included, no attribution
required. Sourced by driving kenney.nl in a headed browser with Playwright;
the licence text and the file-by-file provenance are in
[Assets/sfx/LICENSE.txt](Assets/sfx/LICENSE.txt). 108 KB for all ten.

Counting climbs a **major scale** — semitone steps 0, 2, 4, 5, 7, 9, 11, 12,
repeating an octave up — instead of a flat percentage per count. Ten counts in a
row want to sound like music rather than a siren, and it means a child hears the
count rise as well as seeing it.

| Cue | When |
| --- | --- |
| `panel-open` | the instruction plate unrolls |
| `count` | each treat lights up — a bright ding **up a major scale**, one degree per count |
| `tap` | each dip of the hand nudge (twice per tap) |
| `pad-open` | the number pad rises |
| `key` | the child taps a key |
| `correct` / `wrong` | the answer is checked |
| `berry-fly` / `berry-land` | each treat leaves the table, and lands on the glass 90% through its flight |
| `cap-close` + `cap-seal` | a solid close 330 ms into the cap's drop, then a shine as it seals |
| `creak` | the idle nudge — the spooky house's own voice |
| `stage` | a short pizzicato jingle as each new stage arrives |

Each play clones its `<audio>` node, so overlapping cues never cut each other
off, and `preservesPitch = false` is what lets the counting cue change pitch
rather than just speed. Levels are per-cue (`SFX.gain`) because the two packs
are not mixed to each other.

**Audio needs a gesture.** Browsers block sound until the page has been
interacted with, so on a cold load the first cues (and Agni's first line) may be
silent — `playSfx` swallows the rejection and the visuals never depend on audio.
The first pointer or key event unlocks it. If this screen can be reached without
a prior tap, it wants a "tap to start" gate.

### On-screen text

**Everything Agni says goes on the plate as well** — except the counting, which
the script marks `(VO)`. In order, the plate carries:

> Count the Treats Together
> Let us count these treats together.
> *(counting 1…6 — spoken only; the plate holds the line before it)*
> We have 6 treats.
> Now, let us put the magic number on the jar.
> Jar Closed!
> Yay! All packed.

A line goes up **whole, the moment the voice starts it**. Typing it out needs
the reveal to keep pace with the speech, and any drift between the two is
visible on screen — appearing as he begins the line cannot drift.

`showOst()` fits each line to the plate. Short ones keep the design's 56 px;
longer ones step down and wrap onto a second row if they still will not fit.
Level 1's line is 84 characters and Level 2's is 118 — at any readable size on
one row they run clean off the plate. Measured across every line in the script:
56 px for the short ones, 52 px on two rows for the level lines, 40 px for the
longest, and all of them inside the plate.

### The hand nudge

`hand.webp` is 312 x 446 with its fingertip on the very top row, 36.7% across.
That point is the anchor, so `--hand-x` / `--hand-y` are simply *the thing being
pointed at* — `keyCentre()` reads a key's real rect rather than repeating
coordinates. Drawn at 80 x 114 with `z-index: 6`, above the pad, the panel and
the jar. It travels between targets on a CSS transition, dips twice to tap, and
holds a slow point while waiting on the child.

The design's static line, *"Count all the groups and loose treats."*, is
replaced by the script's lines.

`prefers-reduced-motion: reduce` skips the flight, the typing and the glow
animations, and lands each element in its finished state.

**Every animated layer's default state is its *finished* state**, and each
animation only describes how it arrives there. Nothing depends on an
`animationend` event landing, so a dropped event can never leave the screen
half-built — worth knowing, because `animationend` genuinely does not fire under
headless Chrome's `--virtual-time-budget`, which is how this was caught.

---

## 📁 Files

| File | Contents |
| --- | --- |
| [index.html](index.html) | Stage markup — one layer per Figma layer, in the design's z-order |
| [styles.css](styles.css) | All layout and animation. Every layer carries its exact Figma coordinate |
| [script.js](script.js) | Coordinate tables (treats, keys), intro timeline, answer entry, stage scaling |
| [Assets/](Assets/) | Design assets |

### Assets

| File | Figma node | Notes |
| --- | --- | --- |
| `background.png` | `190:498` | Wooden table, 3838 × 2160 |
| `blue barries.svg` | `190:547` | One treat, **shadow baked in** — 215 × 208, berry in the top-left 157 × 156 |
| `agni fly gif.gif` | `190:513` | 594 × 466, 36 frames @ 60 ms; dragon occupies 423 × 427 of the canvas |
| `Jar.png` | `190:506` | Glass jar — **differs from the jar currently in the Figma frame** |
| `answer-panel.png` | `190:516` | **Sprite sheet** — the answer plate is a crop of it |
| `keypad.png` | `190:518` | **Sprite sheet** — the 3 × 4 plate grid is a crop of it |
| `green-button.png` | `190:533` | Submit plate |
| `tick.svg` | `190:534` | Tick vector |
| `Intrustiction panel.svg` | `190:507` | The standing Agni, clipped from its left 161 × 161 |

`Intrustiction panel.svg` is the whole 1079 × 161 panel with the mirrored dragon
already drawn into its left 161 × 161, so the plate and the dragon can't move
independently — the dragon would stretch as the plate opens. It is therefore used
*clipped to that left square*, which is precisely the design's Agni layer
(`190:513`). The sliver of plate that comes with it lands on top of
`.panel__plate` — the same rounded rect (x 91→1079, y 36→156, 50 px left corners,
24 px right) at the same coordinate — so the two are indistinguishable, and the
plate keeps its own open animation.

---

## 🧭 How the layout works

**Fixed canvas.** `.stage` is exactly 1920 × 1080 with every element absolutely
positioned at its Figma coordinate. `fitStage()` in [script.js](script.js) sets
`--scale` to `min(vw/1920, vh/1080)`, so the screen scales as one piece and is
letterboxed — nothing reflows and nothing drifts out of alignment.

**Sprite crops.** `answer-panel.png` and `keypad.png` are sheets containing a
banner plus twelve plates. The design shows a *region* of each, so those layers
use the `.crop` pattern: a fixed-size box with `overflow: hidden` holding an
explicitly sized, offset image — the same scale/offset numbers Figma uses.

**The cap just drops** — 215 px straight down with one small settle (620 ms).
Two spins were tried and dropped: a 2D `rotate` tumble (which stands a flat
ellipse on its edge, so the cap looked like a cartwheeling plank) and a
`rotateY` turn about its own axis (correct-looking, but a gimmick on a lid this
chunky).

**Seating the cap.** `Jar cap.png` is 563 x 286, opaque bounds x 36..527,
y 25..261, widest at rows 110-130 (491 px across). It is drawn at 538.8 x 273.7
from (1185, 80) — tunable via `--cap-x/-y/-w/-h` in [styles.css](styles.css).
That places it **on** the lip: the staves cover the top of the rim and the glass
rim ring stays visible below them, with no glass arcing over the cap. Sitting it
lower (matching the lip's widest row exactly) put the jar's back rim above the
cap, which read as a lid dropped on from the side.

**The pad opens on demand.** The keypad starts shut; the answer panel carries a
transparent tap target with a slow glow, and tapping it rises the pad into place
(420 ms). Because the plate artwork and the digits have to move as one piece, the
`.keys` layer shares the keypad's box and key rects are re-based onto
`KEYPAD_ORIGIN` — verified pixel-identical to the previous always-open pad.
Under reduced motion the glow is static rather than absent, so the panel still
reads as tappable.

**Keypad hit areas.** The key plates are painted into `keypad.png`, so the keys
themselves are transparent `<button>`s laid over their plates (`COL_CENTERS` /
`ROW_CENTERS` in [script.js](script.js)). The bottom-right key uses the design's
exact green-button rect. Digit glyphs keep the design's hand-placed coordinates
rather than being re-centred, so the slightly uneven spacing of the original is
preserved. Pressing a key shows a soft rounded highlight.

**Treats.** `blue barries.svg` is 215 × 208 because the drop shadow is baked in
as an SVG filter; the berry itself fills the top-left 157 × 156, which is its
design box. Positioning the 215 × 208 box at the design coordinate therefore
leaves the berry exactly where Figma has it, and no CSS shadow is needed.

**Blink.** The artwork has no closed-eye frame, so each eye gets a lid element
in the body's blue (`rgb(40, 111, 224)`, sampled from the art) with a dark lash
line, rolling down from the top on `scaleY`. The eye boxes were measured off a
3× render of the SVG: whites are 21 × 22.7 at y 80, x 42.7 and x 97.3 within the
berry's 157 × 156 box. Closed, it reads as a happy squint — the eyebrows stay
visible above the lid.

**Text strokes.** Every text layer in the design is outlined, and Figma's
generated code drops that entirely — the widths were measured off the design
render and live in the `--stroke-*` tokens:

### Layer opacities

Two layers are dialled back from the design so the keypad reads crisply through
the glass — tokens at the top of [styles.css](styles.css):

| Layer | Design | Build | Token |
| --- | --- | --- | --- |
| Jar glass | 100 % | **75 %** | `--jar-opacity` |
| Submit plate | 90 % | **80 %** | `--submit-opacity` |

The submit plate goes fully opaque while pressed (`--submit-opacity-pressed`);
the tick itself is always fully opaque.

| Layer | Stroke |
| --- | --- |
| Instruction copy | 1 px black *outside* the fill (`paint-order: stroke fill`, 2.4 px centred) |
| Keypad digits `0–9` | 1 px white, centred over the ink fill |
| `X` | 2.5 px ink, centred over the white fill |
| Answer number | 6 px ink over ink — reads as a bolder weight |

---

## ✅ Verified against the design

Rendered at 1920 × 1080 in headless Chrome and diffed against the Figma export
of `190:495`, excluding the answer plate (the design shows a static `6`, the
build starts empty):

- Everything left of the jar — background, treats, Agni, instruction panel:
  mean per-pixel difference **1.37 / 255**.
- The jar area now differs from the design on purpose (mean 31.8) because the
  glass and the submit plate were deliberately faded; before that change the
  whole frame sat at **2.05 / 255** with **0.70 %** of pixels off by >32.
- Landed Agni: mean **1.03** — the standing pose clipped from the panel SVG
  matches the design layer almost exactly.
- Treats: mean **1.07**, only **0.04 %** of pixels off by >32 — the SVG's baked
  shadow matches Figma more closely than the CSS `drop-shadow()` it replaced.
  (Measured with the idle paused; while it runs each berry rides up to 5 px off
  its design coordinate by design.)
- Blink lids change **only** the eyes — the diff between open- and closed-eye
  renders is confined to the union of the twelve lid rects.
- Instruction text bounding box: Figma `220,98 → 1015,148`, build `220,97 → 1015,149`.
- Keypad digits `1`, `5`, `0`: within **1 px** of the design on both axes.
- Answer glyph: within **2 px**; stroke run-widths match (16/15 px vs 16/15 px).
- Both the animated and reduced-motion paths settle to the same frame (2.05 vs 2.05).
- Stage fits exactly (1.778 aspect, no cropping) at 1366×768, 1600×900,
  1280×1024 and 2560×1440.

Corrections the diff turned up:

1. Itim's web line box sits **2 px** above Figma's text box → keypad glyphs carry
   a `--glyph-fix: 2px` nudge.
2. The answer number looked 10 % small. First read as a 110 px font; measuring the
   stroke showed the real cause — it is **100 px with a 6 px ink stroke**, which is
   what the build now uses.
3. `.stage` was being shrunk below 1920 px as a flex item, cropping the jar's
   right edge below 1920 px wide → `flex: none`.

### Intentional differences from the static design

| Design | Build | Why |
| --- | --- | --- |
| Agni is a still | Flies in, then holds the still | Requested intro; the landed frame is the design's artwork |
| Answer plate always shows `6` | Starts empty, fills as the player types | It is the live input |
| Answer `6` at a fixed x (1419) | Centred on the plate | Keeps 2-digit answers balanced (single digit lands within ~1 px of the design) |
| Background layer is 1919 px wide | 1920 px | Avoids a 1 px seam at the right edge |
| Jar glass at 100 % | 75 % | Requested — softens the glass over the keypad |
| Jar artwork | `Jar.png` supplied in `Assets/` | Different render from the Figma jar layer; tested against the design's own fill and no fade factor explains the gap, so it is a deliberate asset swap. The Figma jar layer is out of sync with it. |
| Keypad always visible | Opens on an answer-panel tap | Requested |
| No end state in the design | Treats fly into the jar, lid closes | Requested |
| No lid in the design | `Jar cap.png` drops on | Requested |
| Submit plate at 90 % | 80 % | Requested |

---

## 🔜 Not built yet

- **Screens 2+** of section `190:494` — only frame `190:495` is implemented.
  `roundcomplete` fires on the stage when the answer is right; wire the next
  screen to it.
- **Grouped treats.** The copy says *"Count all the **groups** and loose treats"*,
  but frame 1 only contains 6 loose berries. Grouped/boxed treats presumably
  arrive in a later frame — `TREATS` in [script.js](script.js) is a flat list and
  will need a group concept then.
- **Audio** — no sounds in the design.
- **Fonts** load from Google Fonts (Itim, Londrina Solid). Self-host them if the
  game has to run offline.
