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

### Inside the jar: the design's own arrangement

The design has a **packed frame for each stage** — the treats inside the jar are
placed there by hand, so it is not something to compute. The tutorial's
(`267:186`) is now used verbatim: `JAR_LAYOUT` holds each apple's centre, the
side of the square it is drawn in (220-316 px — they vary) and its tilt. Where a
stage has an entry, the flight lands on it; otherwise the computed heap is used.

**Reading rotated nodes out of Figma.** `get_metadata` reports a rotated node's
x/y *before* its transform, so those coordinates are not where the thing appears
— chasing them put the treats 120-190 px out. The generated CSS is the way in:
its `inset` box is the post-transform bounding box, and the rotated square is
centred in it, so the inset centre is the real centre. Checked against the
design's render: within 2 px.

Frames still to lift, when their arrangements are wanted: `11` (candies), `9`
(jellies), `13` (strawberries), `17` (marshmallows), `19` (walnuts).

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

| File | Where it comes from | Notes |
| --- | --- | --- |
| `background.png` | design | Wooden table, 3838 × 2160 — byte-identical to the frame's own fill |
| `Jar.png` | design | Glass jar, 697 × 895 — byte-identical to the frame's |
| `apple.png` `candy.png` `jelly.png` `strawberry.png` `marshmallow.png` `berry.png` `walnut.png` | design | One treat each. **All seven are 1254 × 1254**, drawing centred on transparency |
| `packet-jelly.png` | design, cropped | The design shows this bag through a crop box; the file is cropped to match (1936 × 1017) |
| `packet-strawberry.png` | design | The punnet, 1402 × 1122 — a single composite in the design too |
| `packet-walnut.png` `packet-berry.png` | design, composited | Built from the shared `Transparent packet` bag plus the design's own 5 × 2 treat-grid image, at the design's proportions |
| `packet-marshmallow.png` | authored | Same bag, with a 5 × 2 grid laid out from `marshmallow.png` — the marshmallow frame's grid image was never reachable (see below) |
| `Jar cap.png` | supplied | The lid that drops on at the end; not in the design |
| `agni fly gif.gif` | supplied | 594 × 466, 36 frames @ 60 ms; dragon occupies 423 × 427 of the canvas |
| `answer-panel.png` | design | **Sprite sheet** — the answer plate is a crop of it |
| `keypad.png` | design | **Sprite sheet** — the 3 × 4 plate grid is a crop of it |
| `green-button.png` | design | Submit plate |
| `tick.svg` | design | Tick vector |
| `Intrustiction panel.svg` | design | The standing Agni, clipped from its left 161 × 161 |
| `hand.webp` | supplied | The nudging hand |
| `sfx/` | freesound (CC0) | 15 clips + `LICENSE.txt` |

Every treat asset is the same 1254 × 1254 square, which is what makes a design
measurement usable directly: the size Figma reports for a treat inside the jar
*is* the size to draw that square at. `ART[k].ink` records how much of the square
the drawing actually covers (a walnut 58 % across, an apple 73 %), and `inkH` the
same vertically. Spacing on the table goes by those, never by the square — by the
square alone the walnuts drift apart, and by the width alone the tall ones stack
into each other.

The SVGs the design was previously read from (`Apple.svg`, `yellow jelly.svg`,
`orange candy.svg`, `stoberries.svg`, `marsmalo.svg`, `walnuts.svg`,
`blue barries.svg`) are each a wrapper around one of these same 1254 × 1254
rasters — checked byte for byte on the apple and the jelly. `marshmallow.png` and
`berry.png` were extracted from theirs, since those two frames were not
reachable.

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

**Treats.** All seven are the design's own 1254 × 1254 PNGs, drawing centred on
transparency, so one convention covers everything: the element is that square
scaled to `size`, positioned by its centre, and `ink`/`inkH` say how much of it
the drawing fills.

**Blink.** The artwork has no closed-eye frame, so each eye gets a lid that
paints **a patch of the treat's own skin** over it, plus a lash line, rolling
down from the top on `scaleY`. `eyes.dx`/`dy` say where that patch comes from, in
eye-widths and eye-heights. The eye boxes were found by locating the two pupils
by darkness and growing each into its eye white, refusing growth that runs away
— the marshmallow's body is white and touches its eyes, so unchecked growth
swallows the whole face.

The copy direction cannot be measured on flatness alone. Scoring picked *above*
for the apple and the strawberry, where flat green leaf beats seeded red fruit —
and both then blinked green. Both take their skin from below instead. The
strawberry is the one treat with no clean patch anywhere: leaves above, and the
fruit narrows to a point too soon below to fill a lid the size of its eye. It
names its skin colour instead (`eyes.fill`), and the lid paints that. A seeded
version of the fill was tried and dropped — a regular dot grid reads worse than
plain shading at the size a blink is actually seen.

**The instruction copy is centred** across the plate rather than left-aligned
against the dragon, which is how the design sets it — a short line looked
stranded otherwise. Long lines still step down in size and wrap onto a second
row, and the pair stays centred as a block.

**Text strokes.** Every text layer in the design is outlined, and Figma's
generated code drops that entirely — the widths were measured off the design
render and live in the `--stroke-*` tokens:

**Inside the jar.** Every stage's filled jar is laid out by hand in the design,
so `JAR_LAYOUT` in [script.js](script.js) carries the design's own slots rather
than computing a heap: centre, tilt, and the size the art is drawn at, for each
pack and each loose treat.

Reading them out needed one thing understood first. Figma reports a rotated node
as a **post**-rotation bounding box plus a rotation, with the artwork rotated
inside it — so the box centre is the visual centre, and the art's own side comes
back from the box, because a square of side *s* tilted by *t* has a box of
`s·(|cos t| + |sin t|)`. Every candy in frame 2 came back at 259.0 px from
fourteen different boxes, which is the check that the derivation is right. The
node's own reported x/y is *not* the box: it is the transformed corner, which is
why the earlier attempt to read positions from the node boxes was wrong.

The design fills each jar right up for the picture, so most frames hold more
treats than the stage counts — 32 jellies where the answer is 15, 23
strawberries where it is 27 (two packets and seven loose). The count has to stay
honest, so the engine takes the **lowest** slots first and leaves the rest: the
pile keeps the design's sizes, tilts and placement at the number of things the
child is actually being asked to count.

| Stage | Answer | Design frame | Slots it offers | Used |
| --- | --- | --- | --- | --- |
| Tutorial | 6 | `267:186` | 7 apples | 6 |
| Level 1 | 9 | `269:189` "2" | 14 candies | 9 |
| Transition 1 | 15 | `269:53` "3" | 1 packet + 32 jellies | 1 + 5 |
| Transition 2 | 27 | `272:339` "4" | 2 punnets + 23 strawberries | 2 + 7 |
| Level 2 | 42 | — | authored: 4 packets + 2 loose | 4 + 2 |
| Level 3 | 50 | `272:536` "6" | 5 packets | 5 |
| Level 4 | 79 | `272:678` "7" | 7 packets + 15 walnuts | 7 + 9 |

The x figures above are the design's own, plus the 60 px the whole jar column
moved (below).

Level 2 is the one gap. The marshmallow screen exists — its two frames sit at
canvas x ≈ 20073 and 22033, between strawberry ("4", x 18113) and blueberry
("6", x 24014) — but its node id could not be found. `get_metadata` on the page
returns a **stale** tree that predates these frames (it still lists the old
27-screen design and the loose `271:*` nodes but none of the `272:*` frames),
while per-node lookups resolve fine, and the ids are not allocated in any order
that could be walked: the blueberry table frame is `272:409` with children
`272:410-414` *and* `272:517-535`, and probes across `272:378-535` come back
empty. So Level 2's four packets and two loose treats are authored in the same
idiom — the same bag art as Level 3, nearly level, stacked in two tiers.

**The jar sits 60 px right of where the packed frames put it.** The design
disagrees with itself: the screen with the keypad open (`267:137`) has the jar at
x 1204, the pad at 1260, the plate at 1344 and every digit 60 px right of where
the six packed frames put them, which all have the jar at 1144. The build follows
the keypad frame — it is the screen the child actually plays on — so the jar, the
cap, the sparkles, the pad, the digits, the submit key, the flight geometry and
every in-jar slot carry that +60. The plate goes to the design's 1344, which is
+70: it had been read 10 px left of where the keypad frame has it. The plate then
lands in the jar's neck, exactly as the design's own jar render shows it.

**Packets are built so nothing stretches at run time.** Figma fills each packet
layer with its own non-uniform scale, so the same bag file appears at a different
aspect in different frames — and because the bag and the treats are separate
layers there, it can stretch one without the other. A packet flies as a single
element here, so that has to be baked in: each composite is the bag resized to
the shape the design draws it in, with the treat grid fitted inside it
*uniformly*, so the treats keep their own proportions. Each file's aspect then
equals the shape it is drawn in, and the `<img>` filling its box changes nothing.

Two things had to be got right, and each announced itself on screen:

- **The grey line.** The bag files carry a dark outline *outside* the white bag:
  rows above the white edge measure a flat (123,123,123), the zigzag itself 186+.
  Figma crops it away. Kept, it reads as a stray line above the pack.
- **The crop must stop there.** Reading that crop as cutting into the bag, and
  "fixing" it by using the whole file, put the outline back and stretched the
  treats 27 % wide.

**On the table.** These arrangements come from the design directly:

- Level 3's five packets are the file's own coordinates (`272:409`).
- Transition 2, Level 2 and Level 4 were measured off the design's renders,
  since those frames' node ids are not reachable — good to a few pixels rather
  than exact. `YARD_LAYOUT` holds all four.

And two more:

- The tutorial's six apples are its own group (`285:16`): a tidy 3 × 2, upright,
  all at 280.7, read left to right and top to bottom — which is the order they
  are counted in.
- One packet plus a few loose treats (Transition 1) is drawn differently from
  the rest: the single packet goes across the top of the yard, 679 wide, and the
  loose treats sit in **one row underneath it**, lined up with the packet's own
  columns and drawn about the size of the ten inside it. `oneGroupYard()` does
  exactly that, taking the row's spacing and size from the packet's grid so the
  same object is the same size inside the pack and outside it.

Whatever `YARD_LAYOUT` does not cover falls through to `layoutStage()`, which
follows the design's shape without matching it: a block of packs with the loose
treats beside them. Two nudges brought it closer — the pack block prefers a
squarer shape when that costs less than a sixth of the pack size (four packets as
2 × 2, not a column of four), and the loose block prefers a squarish grid (nine
candies as 3 × 3, as the design draws them).

**A line marked (VO) is spoken and nothing else.** The script's VO column doubles
as the on-screen text, except where a line carries a `(VO)` marker — the
tutorial's count, Level 1's instruction, "Look! These treats are in a group.",
"It is your turn to pack now!". Those steps set `voOnly`, and `say()` skips the
plate for them. Counting was already silent on the plate: the numbers are spoken
and the treats pop, so writing them up would only repeat the screen.

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

### Two ways the pad could go dead

Both found by playing every stage through in a real browser rather than by
reading the code, and both would have looked like the game ignoring the child.

1. **The last stage's restriction leaked into the next one.** A guided stage ends
   with only the answer's digit clickable — the tutorial ends on `['6']` — and
   starting the next stage did not clear that, so Level 1 opened with 6 as the
   only live key and nothing else responded. `shutKeypad()` now empties the
   allow-list: a shut pad responds to nothing, which is both true and what stops
   the leak.
2. **The pad went live a beat before any key would answer.** Opening the pad and
   saying which keys may respond are two different callers on two different
   timers — the pad became visible and unlocked ~220 ms before the allow-list was
   set. `unlockKeypad()` now refuses to unlock onto an empty allow-list, so the
   pad goes live exactly when a key can actually answer.

Every stage was then played through in a real browser — plate tapped, answer
typed, tick pressed — and all seven land the treats and seal the jar with no
console errors: 6, 9, 15, 27, 42, 50, 79. A wrong answer followed by the right
one was checked separately on Level 1 and Level 2: the pad comes back with the
whole keypad live and the second try wins.

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

- **Recorded VO.** Agni is the browser's own speech synthesis, filtered to the
  highest-pitched non-male voice available. It is still an adult voice on most
  machines — the one thing that cannot be fixed in code. Every line is already
  dispatched as a `vo` event, so recorded audio can be dropped in without
  touching the flow.
- **Four arrangements are measured off renders, not lifted from the file**:
  Level 2's jar, and the Transition 2 / Level 2 / Level 4 yards. Their frames'
  node ids are not reachable (see above), so those are good to a few pixels
  rather than exact. Pasting the node ids in would let them be measured like the
  rest. Level 1's and the tutorial's yards, Transition 1's single-packet yard and
  Level 3's five packets all come from the file.
- **The strawberry punnet keeps its own aspect** rather than the flatter shape
  the design stretches it to. It is a single composite asset, so tray and fruit
  cannot be scaled apart; keeping it uniform keeps the strawberries in
  proportion, and the tray reads slightly deeper than the design's.
- **Feedback on a disabled key.** During a guided stage only the expected digit
  responds; tapping any other does nothing at all rather than saying so.
- **Skip, replay and progress controls**, and the story screens either side of
  the play section.
- **Fonts** load from Google Fonts (Itim, Londrina Solid). Self-host them if the
  game has to run offline.

## Stillness while playing, blinking when idle

The treats used to breathe and blink from the moment they landed. That reads as
decoration competing with the lesson, so both animations now wait for the stage
to doze: `.stage--sleepy` gates them, and it is only set after ten seconds with
nothing happening. Any pointer, key, touch or wheel event clears it instantly,
and so does a line of on-screen text — a stage that is mid-sentence is not
idle, which is why `showOst()` pokes the same timer.

The per-treat animation delays are now wrapped (`i % 7`, `i % 5`). They only
exist to keep neighbours out of step, and unwrapped they reached forty seconds
on a pack of ten — fine when the animation ran from page load, useless when it
has to start the moment the screen goes quiet.

Checked in the browser: nothing animates 1.5s or 7.5s after a tap, both
animations are running at 11.5s, and the next tap stops them again.

Level 4's on-screen text follows the script's two lines — "Count all the
treats." while counting, "Write the number on the jar." once it is time to
answer — using the same `ost:` step key Transition 2 already used for its
mid-stage line.

## The child opens the pad, even in the tutorial

The tutorial used to have the hand tap the answer plate itself and the keypad
would spring open unasked. Watching a hand do it teaches nothing about doing
it, so `nudgeToPanel()` now points at the plate and hands over to
`awaitChildTap()` — the same wait the unguided levels use. The pad stays shut,
the keys stay dead and the plate keeps breathing until the child taps it;
after that the guided walk resumes exactly as before, with only the answer's
next digit live.

`awaitChildTap()` takes an optional continuation for this: with one, the tap
opens the pad and the stage carries on with the hand walking the digits;
without one, the whole pad simply comes live for the child's own turn. That
made `handTap()` — the hand tapping on the child's behalf — dead, so it is
gone.

Two nudges pointed at the answer plate with hand-copied coordinates, and the
inactivity one still held the pre-redesign numbers, so after ten idle seconds
the hand appeared 190px below the plate. Both now read `ANSWER_CENTRE`.

Checked: the pad reads `keypad--closed` with `state.allowed` empty both
immediately and 2.5s later, opens only on the tap, and the tutorial still walks
to 6 and seals.

The plate that has to be tapped now pops rather than swells: a beat with a
small lift, 1500ms, easing that overshoots slightly. One slow 1.5% swell was
too quiet to read as an invitation. It scales about 50%/60% so the lift reads
as the plate coming toward you, and the animation is dropped the moment the
pad opens, so it never runs while a number is being typed.

## The instruction copy sat low, and now arrives from the left

`.panel__text` carried two `height` declarations — a 66px one beside the
original `top: 85px`, and a later 120px one. The second won, so the box became
the plate's full height but still started 23px below the plate, and every line
rendered low. The box is now the plate's own 120px at `top: 62px`, which puts
the copy's middle on the plate's middle exactly (measured: 122.0 against
122.0). Horizontally it is left-aligned, starting at 232 — just past the dragon, with
a little air between his hand and the first letter. Centred was tried first and
rejected: a short line drifted into the middle of a wide plate and read as a
label rather than something being said. `OST_SIZE.width` tracks the same box,
so a long line still stops short of the plate's right edge.

A new line also sweeps in from the left now — a 460ms `clip-path` wipe on the
text span. The whole line is in the DOM before the wipe starts, so unlike
typing it character by character this cannot drift out of step with the voice.
The insets are negative on the other three sides so the letters' black stroke
is not clipped.

Counting is exempt: "1," grows into "1, 2," and re-sweeping the whole run on
every number would make the numbers already up there flicker, so `showOst()`
only wipes when the new line is not an extension of the one on screen.

## The loose walnuts grew into each other

Nine loose walnuts sat in two staggered columns on a hand-set 108px pitch at a
167px square. A walnut draws taller inside its square than any other treat
(`inkH` 0.774), so it stood 129px tall on that pitch and each one overlapped
the one below by 21px.

The columns are now generated rather than typed: the pitch is the drawn height
plus an 11px gap, so the two can no longer disagree. The square came down to
134px, which is what makes them fit — the drawn walnut is 77 x 104, the pitch
114.7, and the column runs 448 to 1011, clear of the pack above it and of the
bottom of the yard. They are still drawn a little larger than the walnuts
inside a pack, which is what tells a child the loose ones are the loose ones.

Verified across all seven stages by measuring every loose treat's drawn
rectangle and testing every pair: no overlaps anywhere, and on Level 4 no loose
walnut touches a pack either.

Two bugs this turned up, both mine:

- `walnutColumns()` is called while `YARD_LAYOUT` is being built, but its
  constants were declared after the table. That threw during the script's own
  evaluation, which left every `const` after it in the temporal dead zone — so
  the visible symptom was a cascade of unrelated "cannot access X before
  initialization" errors. The constants now precede the table.
- `wakeUp()` had the same shape: hoisted, called from `showOst()`, but its
  timer was a `let` three hundred lines below. It lives on `state` now, with
  `SLEEPY_MS` up with the other timings.

The measuring script was wrong too, and worth recording because the mistake is
easy to repeat: a treat's element is `art.art` (1254) px square and scaled
about its centre, so the drawn square is `art.art * scale`. `art.size` is only
the default a layout starts from — multiplying by it under-reported every box
by about 3.4x and made the overlaps disappear.

## The counted treat looked sliced

A pack is one flat picture, and the ten cells that let a single treat pop are
crops of that same picture laid over it. Each crop was exactly one fifth of the
grid wide — but the treats are drawn very nearly as wide as their share, and the
grid rect was a few pixels tighter than the artwork besides, so every crop cut
the sides off its own treat. At rest that is invisible: the crop lies over the
pixels it came from. The moment a cell lifts, the flat edge shows, and it takes
the black outline with it, which is what read as "cut".

Each crop now reaches 9% past its share on every side, which takes in the whole
treat — and, unavoidably, a sliver of its neighbours. So the cell's edges are
feathered: two linear-gradient masks intersected, fading the outer 9% out
again. Rectangular masks rather than one radial, which would have eaten the
corners. At rest nothing changes, because fading a crop that lies over its own
source only lets identical pixels through.

Checked by popping all ten cells of every pack at once over dimmed artwork —
the worst case there is, and far harsher than the one-at-a-time the game
actually does. Jellies and walnuts come out whole. Marshmallows still show a
faint seam where two of them genuinely touch in the art, but nothing is sliced.

Blob-detecting each treat's true rectangle was tried first and abandoned: on
colour the marshmallows fail, their lower half being white like the bag; on
opacity the bag's outline joins every treat into one blob; eroding the mask to
drop the bag then merges the two rows. The padded grid needs no measurement and
cannot go stale when a packet is redrawn.

## The new table looked like it had always been there

A stage reached by a camera pan is built while the room is off frame, then the
camera swings back over 760ms. The treats were popping in 260ms after the
build — halfway through the move, so they were smeared by the travel and all
present by the time it landed. Nothing arrived; the new table simply already
had things on it.

Holding them until the camera landed was tried first, and was wrong in the
other direction: the camera then glided onto an empty table and the treats
appeared on it afterwards, so the move revealed nothing and the table looked
like it had always been that way.

What it wants is the move itself doing the revealing. The table is now set
complete while the room is off frame — jar and treats both — and the camera
finds it, the way a camera moving across a room finds what is in it. Nothing
pops during the move or after it. Agni still waits for the camera to land
before he starts, so no line is spoken off frame.

Traced through a stage change, 60ms a sample: the old table leaves with its six
treats (0-576ms), the new one is complete and off frame at 643ms with all nine
on it, and the camera carries them in over 643-1419ms.

## Candies that came out green

Some of the orange candies rendered green — a red/green channel swap, with
fringing around each one, and only some of the nine. That pattern is a browser
recolouring images, not the artwork: Chrome's auto-dark-mode and the
forced-colours modes decide image by image whether to invert, which is exactly
why three were hit and six were not. A plain run here renders all nine orange,
so nothing in the CSS or the assets was doing it.

The page now declares itself light — `<meta name="color-scheme" content="only
light">` and `color-scheme: only light` on `:root` — which opts it out of
auto-dark entirely, with `forced-color-adjust: none` on the root and on every
piece of artwork for the forced-colours case. A child should see the design's
colours whatever the device has been set to.

The ten seconds now start when the instruction ends, not when it begins. Every
spoken line and every counted number holds the countdown while it is in flight
and releases it when it finishes, so a line longer than the window can no
longer set the treats blinking mid-sentence. It is a count rather than a flag:
counting a group queues one number at a time and they overlap.

Traced with voices forced off, so the lines fall back to their read-aloud
timings and still go through the same hold: Agni was talking in 10 of 60
samples, none of them asleep, and the treats began breathing 10.7s after the
last thing he said.

The recolouring opt-out is not per treat — it sits on `:root` and on
`.treat__body > img`, which is every treat, apples included.

## The washed-out treats were a fade, not the browser

The apples came out pale and translucent, their white highlights pink, their
eyes lavender, and the grain of the plank showing through them. That is what a
treat at partial opacity over the purple table looks like, and the entrance was
fading opacity 0 to 1 over 420ms — so every treat spent four hundred
milliseconds as a ghost of itself before it settled.

The entrance now grows without fading. `treat--waiting` already holds opacity at
0 until the moment the animation starts, so the treat appears at full strength
and scales up from 0.4; `pack-in` the same. Checked across 40 sampled frames of
the entrance: every treat is either fully hidden or fully opaque, never in
between, and a frame caught mid-entrance shows solid saturated apples with the
smallest one still growing.

This is a correction to the previous note. Declaring the page light is still
worth having — auto-dark really does recolour images one at a time — but it was
not what made these apples look wrong, and I should not have concluded it was
without first checking whether anything in the page was drawing them
part-transparent.

