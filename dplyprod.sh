#!/bin/bash

npm run dev
npm run build            # production build
npm run start             # serves the production build
npm test                   # runs the Vitest suite
npx tsc --noEmit           # strict-mode type check
npm run validate:content   # build-time gate: fails non-zero on missing fields,
npx opennextjs-cloudflare deploy 
