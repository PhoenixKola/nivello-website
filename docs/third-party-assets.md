# Third-party assets used by the homepage experience

## Astronaut character: `public/models/astronaut.glb`

- **Asset:** "Astronaut" from the *Ultimate Space Kit* by **Quaternius**: a rigged, animated low-poly character in a spacesuit (file `Astronaut.glb`, shipped unmodified).
- **Source:** https://opengameart.org/content/ultimate-space-kit-by-quaternius (file `ultimate_space_kit-glb.zip`). The author's own site is https://quaternius.com.
- **License:** **CC0 1.0 Universal (public domain dedication)**, as stated on the OpenGameArt page. Commercial use, modification and redistribution are allowed with no attribution required. Credit is given here anyway as a courtesy.
- **Verification note:** the OpenGameArt listing marks the pack CC0. A separate Sketchfab mirror of the same pack shows "CC Attribution" in its license field, which conflicts with the CC0 claim. If you want to be extra careful, confirm the license on quaternius.com before launch; the credit above already satisfies a CC-BY attribution requirement.
- **What we do with it (in code, the file itself is untouched):** the kit's character wears an animal head (a flamingo; the same kit also ships frog and bee variants). `components/home-cinematic/engine/astronaut.ts` keeps the suit, rig and the `Idle`, `Yes`, `No` and `Wave` clips, hides the pistol prop, folds the neck bone away and fits a helmet, visor, collar and life-support pack built from three.js primitives in this repository.
- **Use:** the model is loaded lazily, cloned per character (one download serves the single planning astronaut and the three-person team) and animated with a `THREE.AnimationMixer`. If the file cannot be loaded the engine falls back to the procedural operator in `operator.ts`.

## Considered and not used

- Kenney "Space Kit" (CC0): its `astronautA/B` models are blocky, helmetless figures that did not fit the premium tone.
- Paid and unclear-licence astronaut packs found on marketplaces were not used.

Everything else in the homepage world (terrain, the project cylinder and its hatch, the review corridor, the pyramid, screens, textures and the review paintings) is generated in code or drawn to canvas textures in this repository. Client logos on the review paintings are the existing files in `public/client-logos/`.
