# JetBrains Maple Mono web font

- Upstream: https://github.com/SpaceTimee/Fusion-JetBrainsMapleMono
- Release: `1.2304.79`
- Archive: `JetBrainsMapleMono-XX-XX-NL-XX.zip`
- Source face: `JetBrainsMapleMono-Regular.ttf`
- License: SIL Open Font License 1.1 (see `JetBrainsMapleMono-OFL.txt`)

The web font was converted without subsetting using fontTools 4.63.0:

```sh
uvx --from 'fonttools[woff]==4.63.0' fonttools ttLib.woff2 compress \
  JetBrainsMapleMono-Regular.ttf \
  -o JetBrainsMapleMono-Regular-1.2304.79.woff2
```

SHA-256:

```text
d88f1b5e5e925f419076024ea74d141f7c926376e40459fd1eafa8ab585a9fb5  JetBrainsMapleMono-Regular-1.2304.79.woff2
6728aae70e0be6316b28681c5a806827b4d7daafe45fb767b932c790216c2533  JetBrainsMapleMono-OFL.txt
```
