# Prompt per il video promozionale degli store

Ultimo aggiornamento: 12/11/2026

Prompt per un generatore di video con l'intelligenza artificiale (Veo, Sora, Kling, Runway). È in inglese perché questi strumenti rendono meglio così; le scritte che compaiono nel video sono in italiano.

## Da sapere prima

- **App Store (Apple):** l'"anteprima dell'app" deve mostrare **riprese vere dell'app** (registrazione dello schermo). Un video generato non è ammesso lì. Usalo come guida per montare le tue registrazioni (stesse scene, stesso ritmo, stesse scritte).
- **Google Play:** il video promozionale è un link a YouTube e può essere più libero: lì il video generato va bene, meglio se alternato a riprese vere del gioco.
- **Formato:** verticale 9:16 (1080×1920), 30 secondi, i primi 3 secondi devono catturare senza audio (molti lo guardano muto).

## Prompt principale (video unico da 30 secondi)

```
A 30-second vertical (9:16) promotional trailer for a cozy, relaxing mobile game about caring for bonsai trees in a tiny Japanese garden. Visual style: stylized painterly realism — the warm, soft atmosphere of a Studio Ghibli film, the miniature floating-diorama look of Tiny Glade, and the bold, chunky, friendly UI of a Supercell game. Soft golden light, gentle depth of field, saturated but harmonious colors, botanically accurate plants rendered with soft painterly textures. Calm, slow, satisfying camera moves; ASMR close-ups. No people visible, only a gentle hand-touch cursor or fingertip ripple when the player interacts.

The setting: a small floating island garden suspended in a warm sky with soft clouds — raked white gravel with concentric circles, a lush lawn dotted with tiny flowers, a koi pond with water lilies and a pink lotus, a moss-covered stone lantern, stepping stones, a bamboo fence, a blossoming tree in the background, roots and rock hanging below the island. On wooden tables and stone slabs stand four bonsai in ceramic pots: a Japanese maple with delicate seven-lobed leaves, a Japanese black pine with long brush-like needles, a blue-green juniper with flame-like scale foliage, and a Satsuki azalea with small dark glossy leaves.

Sequence:
0–3s (hook): extreme macro of a single water drop falling onto dry ochre akadama soil, which darkens as it drinks with a soft gurgle. Fast, smooth pull-back reveals the whole floating island garden glowing at golden hour.
3–8s (care): a copper watering can tilts over the maple; its slightly yellowed, drooping leaves lift and turn fresh green in a gentle time-lapse.
8–13s (pruning): close-up of small bonsai scissors snipping a reddish new shoot on the maple with a crisp double click; the cut shoot falls into the pot, and two tiny new buds sprout just below the cut and unfurl into leaves.
13–17s (shaping): copper wire spirals around a pine branch, which bends slowly downward into an elegant, ancient-looking shape; a soft translucent cloud-shaped silhouette appears around the canopy, and a red hanko seal stamp lands with a satisfying thud next to "90%".
17–24s (seasons montage, one smooth orbit around the island, the light changing as it turns): spring — the background tree blossoms pink and the azalea bursts into pink flowers; summer — night falls, the stone lantern lights up with warm glow and fireflies drift over the lawn; autumn — the maple turns fiery red and leaves flutter down onto the koi pond; winter — gentle snow falls, the lawn turns white and the lantern wears a little cap of snow.
24–27s (your garden): decorations pop in with a small bounce and sparkles — a red arched bridge over the koi pond, a sleeping cat breathing slowly in the sun, a bamboo shishi-odoshi fountain tipping with a soft "tock"; the island gently grows wider as new lawn appears around its edge.
27–30s (end card): the camera settles on the whole island at sunset, framed in the center, with space above and below for text. Calm, warm, inviting final frame.

Mood: peaceful, cozy, mindful, rewarding, a quiet daily ritual. Pacing: slow and fluid, no hard cuts, only soft dissolves and continuous camera motion.
Audio: soft Ghibli-inspired piano with gentle reverb, slow arpeggios over warm strings, 62 BPM in F major, an occasional music-box sparkle; delicate sound design — breeze, water poured into soil, scissors snipping, rustling leaves, wooden "tock" of the bamboo fountain, crickets at night.
```

**Scritte da sovrapporre** (in montaggio, nel font tondo e grosso dell'interfaccia; poche parole, sempre al centro in alto):

| Secondi | Scritta |
|---|---|
| 0–3 | *Un piccolo rito, ogni giorno* |
| 3–8 | *Annaffia* |
| 8–13 | *Pota, e guarda ricrescere* |
| 13–17 | *Modella il tuo stile* |
| 17–24 | *Ogni settimana, una stagione* |
| 24–27 | *Un giardino solo tuo* |
| 27–30 | **Giardino Bonsai** · *Non muore mai. Cresce con te.* · Scarica gratis |

**Prompt negativo** (se lo strumento lo accetta):

```
no text, no letters, no logos, no watermark, no people, no faces, no dead or dried-out plants, no dark or gloomy mood, no fast cuts, no shaky camera, no photorealistic stock footage look, no plastic 3D look, no distorted leaves or extra branches, no flickering
```

Le scritte vanno aggiunte dopo, in montaggio: i generatori sbagliano spesso le lettere.

## Prompt scena per scena

Molti strumenti fanno clip da 5–10 secondi. In quel caso si genera una scena alla volta e si montano insieme (anche con CapCut, gratis). Ogni prompt va preceduto da questo **blocco di stile**, sempre uguale, così le scene si somigliano:

```
Vertical 9:16, cozy mobile game trailer shot. Stylized painterly realism: Studio Ghibli warm atmosphere, Tiny Glade miniature floating-diorama garden, soft golden light, gentle depth of field, harmonious saturated colors, botanically accurate bonsai with soft painterly textures. Slow, smooth, satisfying camera motion. No text, no people.
```

1. **Gancio (4 s):** `Extreme macro of a single clear water drop falling in slow motion onto dry ochre akadama soil in a blue glazed bonsai pot; the granules darken as the water soaks in. The camera pulls back smoothly and fast, revealing a tiny floating island Japanese garden in a warm sky at golden hour: raked gravel, lawn, koi pond, stone lantern, bamboo fence, four bonsai on wooden tables.`
2. **Acqua (5 s):** `A copper watering can tilts over a Japanese maple bonsai; gentle stream of water, droplets sparkling in the sunlight. The maple's slightly yellowed, drooping leaves lift and turn fresh vivid green in a soft time-lapse. A faint blue ring glows on the ground around the pot.`
3. **Potatura (5 s):** `Close-up of small Japanese bonsai scissors snipping a thin reddish new shoot on a Japanese maple. The cut shoot with two tiny seven-lobed leaves falls into the pot. Time-lapse: two new buds swell just below the cut and unfurl into tender red-green leaves.`
4. **Filo e stile (5 s):** `Copper wire spirals around a branch of a Japanese black pine bonsai; the branch slowly bends downward into an elegant, ancient shape. A soft translucent white cloud silhouette appears around the canopy showing the target style, then a red Japanese hanko seal stamps down beside it with a soft impact and a few golden sparkles.`
5. **Stagioni (8 s):** `Slow continuous orbit around the floating island garden while the seasons change: spring, the background tree blossoms pink and an azalea bonsai bursts into pink flowers; then summer night, the stone lantern glows warm and fireflies drift over the lawn; then autumn, the maple turns fiery red and leaves flutter onto the koi pond; then winter, gentle snow falls, the lawn turns white, the lantern wears a cap of snow.`
6. **Il tuo giardino (4 s):** `Decorations pop into the garden one after another with a small bounce and golden sparkles: a red arched bridge over the koi pond, a calico cat sleeping and breathing slowly in the sun, a bamboo shishi-odoshi fountain tipping into a stone basin. The island's lawn gently expands outward at its edges.`
7. **Chiusura (3 s):** `Static wide shot of the whole floating island garden at sunset, centered, soft clouds glowing pink and gold, empty sky above and below for a title. Peaceful and inviting.`

## Varianti della frase finale

- *Non muore mai. Cresce con te.* (consigliata: dice il principio del gioco, nessun senso di colpa)
- *Un minuto al giorno. Un giardino per sempre.*
- *Il tuo bonsai ti aspetta.*
- *Impara l'arte del bonsai, una stagione alla volta.*

## Perché queste scelte

- **Il gancio è sensoriale** (la goccia sul terriccio, il suono): nei primi 3 secondi si decide se si continua a guardare, spesso senza audio.
- **Quattro verbi** (annaffia, pota, modella, decora): mostrano in pochi secondi il ciclo del gioco e il suo cuore, la potatura creativa.
- **Le gemme che ricrescono** e il **sigillo dello stile** sono le ricompense più soddisfacenti: fanno capire che c'è un obiettivo.
- **Le stagioni** sono il motivo per tornare (una a settimana) e la parte più bella da vedere.
- **Niente piante secche** nel video: il tono è quello del gioco, calmo e mai punitivo.
