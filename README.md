# Mochis
A repo containing some (mostly anime but not only) modules for Mochi, an iOS/macOS media viewer.

# How to install
- Add `https://mochi.nixuge.me` to Mochi
- Install the modules you need
- Done

# Building
Due to the fact that Mochi's been abandonned by its original dev (Erik), some dependencies are only updated on some forks, making building a bit finnicky

For those step, i assume you're using `bun` on Linux, but you can adapt those to use npm or something else

- Install dependencies by running `bun install`
- Build the forked @mochiapp/js from danielbady (should've been git cloned automatically in the previous step) by running `(cd node_modules/@mochiapp/js && bun run build)`
- Bundle using `bun bundle`
- All done, your built repo should be under the `./dist/` folder

# Testing
This assumes you've already done the "Building" step above at least once.

The runner currently has weird file structure issues for some reason?

If you want to fix that, go to `node_modules/@mochiapp/runner/dist`. Inside that folder:
- Delete the `test` folder
- Move everything inside the `src` folder outside of it and delete it.

Tests should now run normally.