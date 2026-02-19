# Dev notes

## Run npm from this folder

All npm scripts (`npm run dev`, `npm run prod`, `npm run build`, etc.) must be run from the **SIMULATOR** directory (where `package.json` is), not from the parent `fins` folder.

```bash
cd simulator
npm run dev
# or
npm run prod
```

## Out of memory (Array buffer allocation failed / Zone Allocation failed)

If the dev server crashes with "Array buffer allocation failed" or "process out of memory":

1. **Use Turbopack** (often uses less memory than webpack):
   ```bash
   npm run dev:turbo
   ```

2. **Limit Node heap** if you have limited RAM (e.g. 2GB):
   ```bash
   set NODE_MAX_OLD_SPACE_MB=2048
   npm run dev
   ```

3. Close other apps to free memory, then restart the dev server.

## Ray diagram: /objects/*.png 404

Requests like `GET /objects/apple.png 404` are normal if you haven’t added sprite images. The simulator uses built-in shapes when files are missing. To use custom sprites, add these files under `public/objects/`:

- `arrow.png`, `apple.png`, `candle.png`, `tree.png`, `human.png`

See `public/objects/README.txt`.
