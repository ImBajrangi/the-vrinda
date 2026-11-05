# Dead Ends Log

| Iteration | Approach Tried | Why It Failed | Files Touched |
|-----------|---------------|---------------|---------------|
| 1 | Leaving unused variables/imports (`Copy`, `Check`, `BRAJ_GLOSSARY`, `isGlossaryOpen`, `copiedStanzaIdx`, `playbackPace`, `setPlaybackPace`, `handleCopyVerse`) in `PadavaliReader.tsx` | `tsc -b` fails with TS6133: declared but value never read, breaking `npm run build` | `src/components/reader/PadavaliReader.tsx` |
