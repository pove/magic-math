// This app deploys to GitHub Pages as a project page (github.io/<repo>/),
// not the domain root — vite.config.js sets `base: './'` so bundled assets
// resolve correctly under that subpath. A hardcoded string like
// '/models/x.glb' bypasses that entirely: the browser resolves a
// leading-slash path against the domain root regardless of where the app is
// hosted, so it 404s once deployed even though it works fine locally.
// Prefixing with BASE_URL keeps these relative to wherever the app actually
// lives.
export const assetPath = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
