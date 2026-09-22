# CopperCode

CopperCode is a code-first project template for [CopperCube 6](https://store.steampowered.com/app/857350/). Fork it,
rename it, and you have a running game with an engine already under it.

* Write the game in JavaScript or TypeScript in [Visual Studio Code](https://code.visualstudio.com/) — searchable,
  autocompleted, and tracked in version control, instead of buried in a `.ccb`.
* [Webpack](https://webpack.js.org/) and [TypeScript](https://www.typescriptlang.org/) compile the whole project down to
  the single ES3 file CopperCube's interpreter can read.
* [npm](https://www.npmjs.com/) brings in [Crash](https://www.npmjs.com/package/crash-colliders) for 2D collision,
  [TypeFlex](https://www.npmjs.com/package/typeflex) for UI layout, and the shims that make ES2020-era JavaScript run in
  CopperCube at all.

`src/engine/` holds the engine: an entity system with pooling, a Yoga-based UI layout with 9-patch panels and buttons,
tweening, a frame scheduler, mouse picking and hovering, seeded random, and localization. `src/main.js` is where your
game starts.

## Quickstart

1. Install [Node.js](https://nodejs.org/en) and [Visual Studio Code](https://code.visualstudio.com/).
2. Install [F5 Anything](https://marketplace.visualstudio.com/items?itemName=discretegames.f5anything) in VS Code.
3. `cd src && npm install`
4. Open the folder in VS Code and press <kbd>F5</kbd>.

## Renaming the project

CopperCube runs the script named after the project, so the `.ccb`, the `.exe` and the compiled `.js` all have to share
one name. Four places have to agree, plus CopperCube itself:

| | |
|---|---|
| `coppercode.ccb` | rename the file |
| `coppercode.exe` | rename, or just republish from CopperCube once and it is written for you |
| `src/webpack.config.js` | `output.filename` |
| `.vscode/launch.json` | `command` — both the `.exe` and the `-script:` argument |

Then in CopperCube, open the renamed `.ccb` and publish as a Windows `.exe` beside it. The `-script:` argument makes
the name explicit while debugging, so a mismatch will not show up until you publish.

## How a project is wired

The project owns the entry point and the engine is a folder under it, so `src/index.js` is the whole of the handshake:

```js
import { boot } from './engine/index.js'
import { Main } from './main.js'

boot(Main)
```

Import the engine first. Game modules run their bodies as webpack loads them — several will look nodes out of the scene
as they do — and those bodies expect the shims and the globals to already be installed, which is what importing the
engine does. `boot()` then spawns the engine's own entities and finally your root `Entity`.

Two things have to line up outside the code:

| | |
|---|---|
| the `.ccb` scene | must contain nodes named `scene-root`, `stash`, `ui-root` and `node`. This one does. See *The scene contract* below. |
| `behavior_entity` | the CopperCube extension that drives the frame. `.vscode/tasks.json` copies it out of `ext/` into your CopperCube extensions folder on every build. |

## The scene contract

The engine is only half JavaScript. The other half is authored in the `.ccb`, and a `.ccb` is a binary that cannot be
diffed or merged — so if you rebuild the scene from scratch, these names are what the engine looks for:

| node | used by | for |
|---|---|---|
| `scene-root` | `runtime.js` | what world objects are parented to |
| `stash` | `runtime.js` | where suspended objects are parked out of sight |
| `ui-root` | `interface.js` | the root of the UI overlay tree |
| `node` | `interface.js` | the overlay prefab every `Frame` is cloned from |
| `<base>_top_left` … `<base>_btm_right` | `interface.js` | the nine slices of a 9-patch panel, as `setRenderMode(renderMode.ninePatch, base)` |

A node the engine cannot find is not an error you will see at startup — it surfaces later as a panel that never draws
or a clone that goes nowhere.

## Entities

Everything that runs is an `Entity`. Spawn with `spawnEntity` rather than `new`, so instances come from a pool keyed on
the class; `reset()` stands in for the constructor on a reused instance, and `suspend()` hands it back.

```js
import { Entity } from './engine/index.js'

export class Orc extends Entity
{
    reset(at)
    {
        this.node = ccbCloneSceneNode(prefab)
        this.hoverNode = this.node
        this.registerHoverListener()
    }

    on_update(delta) { }

    on_hoverStart() { }
    on_hoverEnd() { }

    on_suspend() { ccbSetSceneNodeParent(this.node, stash) }
}
```

Override only the handlers you need — `on_update` is skipped entirely for entities that leave it alone, so an entity
that only listens costs nothing per frame.

Opt into input with `registerKeyboardListener()`, `registerMouseListener()` and `registerHoverListener()`, then
override `on_keyPress`, `on_mousePress`, `on_mouseWheel`, `on_hoverStart` and the rest.

## Picking and hovering

`boot()` stands up a `Picker` as `global.picker`. It reads the mouse ray once a frame, walks the registered hover
listeners most-recently-registered first, and hovers the first one the ray touches — so exactly one entity is hovered at
a time, as a pointer implies. An entity is tested by the bounds of its `hoverNode` and everything under it; override
`on_hoverTest()` for anything else, such as a tile the cursor is over rather than a mesh.

For picking of your own, `readMouseRay()`, `hitsNode(node)` and `rayPlaneHit(height)` are available both as imports and
on `global`. The ray is only re-read once a frame, so read it again yourself inside a mouse event — those arrive between
frames and would otherwise see a stale one.

## What lands on `global`

The engine follows CopperCube's own API in reaching for globals rather than imports. Installed by importing the engine:

| | |
|---|---|
| `sceneRoot`, `stash` | the authored nodes things are parented to and hidden under |
| `spawnEntity`, `runningEntities` | the entity pool and the frame it runs in |
| `Vec2`, `Vec3`, `crash` | vectors, and 2D collision |
| `Random`, `localize` | dice, and strings out of `loc/<language>.json` |
| `console`, `forEachNode`, `findNode`, `getMouse3DPos` | `console.log` writes to `console.log` beside the exe |
| `readMouseRay`, `hitsNode`, `rayPlaneHit` | mouse ray queries |

and by `boot()`:

| | |
|---|---|
| `scheduler`, `setTimeout`, `sleep` | `await sleep(0.5)` — seconds, not milliseconds |
| `pause`, `isPaused()` | the scheduler, tweens and the picker all respect it |
| `picker`, `interface` | hovering, and the root of the UI |

## Taking engine fixes into an existing project

No import inside `src/engine/` reaches outside it, so the folder can be replaced wholesale:

```
rm -rf <project>/src/engine
cp -r CopperCode/src/engine <project>/src/engine
```

What that will not carry is the scene — if an engine change wants a new node, the `.ccb` has to be edited by hand. Keep
`src/engine/` untouched downstream and fix things upstream instead, or the copy stops being safe.

## A note on the TypeScript version

Pinned to `~5.4.5`, because 5.5 removed `target: es3` outright and CopperCube's interpreter needs it. `^5.4.5` will
resolve to something that refuses to compile. `.vscode/settings.json` points the editor at the same pinned compiler so
it does not flag the config against its own newer one.

## License

MIT. `src/engine/random.js` is from [Sphere](https://github.com/fatcerberus/sphere) (BSD-3-Clause) and
`src/engine/json.js` is Douglas Crockford's `json2.js` (public domain).
