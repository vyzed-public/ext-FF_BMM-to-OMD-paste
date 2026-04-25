# #2: Package: as a permanent Private Extension through AMO

**State:** OPEN
**Author:** vyzed
**Created:** 2026-04-18T04:47:39Z

---

We've been running & testing our extension in development mode:

> **1. Temporary extension via `about:debugging`**

> This is Firefox's developer mode. You navigate to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on...", and select any file from your extension folder (usually `manifest.json`). 

> Firefox loads it immediately — the toolbar button appears, everything works. The catch: it disappears when you close Firefox. Every time you restart the browser, you have to go back to `about:debugging` and load it again. That's fine for development and testing, but annoying for daily use.


But -- before going through all the support headaches of releasing an installable extension...

...there is an intermediate step: a personal private extension.

### **2. Packaging and signing through AMO**

AMO is `addons.mozilla.org` — Mozilla's official extension marketplace. "Signing" means Mozilla cryptographically stamps your extension so Firefox trusts it. This is required for permanent installation in standard Firefox. The process goes roughly like this:

- You zip up your extension files
- Create a free account on addons.mozilla.org
- Upload the zip
- Choose whether to list it publicly (anyone can find and install it) or keep it unlisted (only people with the direct link can install it — good for personal tools like this)
- Mozilla runs automated checks and signs it (usually takes seconds to minutes for simple extensions)
- You download the signed `.xpi` file
- Double-click it or drag it into Firefox — it installs permanently, survives restarts, updates normally

For a personal tool like this, "unlisted" is what you'd want. You're not publishing to the world, you just need Mozilla to sign it so Firefox will keep it installed. Once signed, you can also share the `.xpi` with anyone else who wants it.

---- 

There's a third option worth mentioning: **Firefox Developer Edition** and **Firefox Nightly** allow permanently installing unsigned extensions by setting `xpinstall.signatures.required` to `false` in `about:config`. Standard Firefox doesn't allow this. If you happen to use Developer Edition, this skips the AMO step entirely.

---

## Guidance doc (markdown, not a dumb-ass MS doc): 
* **[AMO Submissions: Errors, Gotchas, and Arcana](https://github.com/vyzed-public/ext-FF_BMM-to-OMD-paste/blob/main/docs/guidance.AMO-submissions.errors-and-arcana.md)**

Key prerequisite: add `data_collection_permissions` to `manifest.json` before submission (see guidance doc §2.1).

---

## Comments

### vyzed — 2026-04-19T20:09:01Z

# Collect: Info on existing related browser extension projects


Searches found two existing related projects to use as benchmarks:
- One is a published Firefox add-on (by [rom100main](https://addons.mozilla.org/en-US/firefox/user/13464738/))
  - Firefox add-on: https://addons.mozilla.org/en-US/firefox/addon/obsidian-bookmark/
  - Project Repo: https://github.com/rom100main/Obsidian-Bookmarks-Browser-Extension
- One is a not-yet-published GitHub repo (by Patrik Zúdel)
  - GitHub repo: https://github.com/patrikzudel/firefox-obsidian-bookmark

Note that the projects have **very similar names and descriptions**, which is why search results may conflated them. 

Especially because they both solve the exact same Firefox→Obsidian bookmark workflow

---

### Query:

```
Is it possible to reverse engineer the mozilla add-on after installation, and create a repo that would let us see and extend the source code?
```

### Response 

**Yes**, it is straightforward to reverse engineer a Firefox add-on after installation by extracting its XPI file, which is just a ZIP archive containing the source code. Firefox extensions are distributed as `.xpi` files that can be unpacked to reveal JavaScript, HTML, CSS, and `manifest.json` — no special tools needed beyond a ZIP extractor. [instructables](https://www.instructables.com/Extract-Firefox-Addon-Source-Code/)

## Exact steps
1. **Download the XPI**: Go to the add-on page (`https://addons.mozilla.org/en-US/firefox/addon/obsidian-bookmark/`), right-click the **"Add to Firefox"** button, and **Save Link As** → save the `.xpi` file. [reddit](https://www.reddit.com/r/firefox/comments/11lghex/how_to_check_the_source_code_of_an_extension/)
2. **Rename to ZIP**: Change the file extension from `.xpi` to `.zip`. [[instructables](https://www.instructables.com/Extract-Firefox-Addon-Source-Code/)](https://www.instructables.com/Extract-Firefox-Addon-Source-Code/)
3. **Extract**: Use any ZIP tool (7-Zip, Windows Explorer, etc.) to unpack the contents. [instructables](https://www.instructables.com/Extract-Firefox-Addon-Source-Code/)
4. **Explore**: Open the extracted folder — you’ll see `manifest.json`, JavaScript files, and other source code. [stackoverflow](https://stackoverflow.com/questions/6788803/reverse-engineering-a-firefox-extension)

## To create a repo
1. Extract the XPI as above.
2. Create a new GitHub repo.
3. Upload all the extracted files (respect the original folder structure).
4. Optionally, edit `manifest.json` and other files to customize/extend it.

## To test modifications
1. Make changes to the extracted source.
2. Zip the folder back up (rename to `.xpi`).
3. In Firefox, go to `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → select your modified `.xpi`. [[youtube](https://www.youtube.com/watch?v=dhaGRJvJAII)](https://www.youtube.com/watch?v=dhaGRJvJAII)

## Important notes
- **Legal**: Respect the author’s license. Many extensions are open-source or permissive, but check `LICENSE` or `manifest.json` for terms. Reverse engineering for personal use/extension is generally fine; redistribution may require permission. [stackoverflow](https://stackoverflow.com/questions/6788803/reverse-engineering-a-firefox-extension)
- **No obfuscation**: Firefox extensions ship as readable source code, not compiled/minified binaries. [[instructables](https://www.instructables.com/Extract-Firefox-Addon-Source-Code/)](https://www.instructables.com/Extract-Firefox-Addon-Source-Code/)
- **Temporary**: Modified versions loaded via `about:debugging` don’t persist across restarts. [[youtube](https://www.youtube.com/watch?v=dhaGRJvJAII)](https://www.youtube.com/watch?v=dhaGRJvJAII)

This workflow works for **any Firefox extension** — the Obsidian bookmark one will unpack cleanly. [reddit](https://www.reddit.com/r/firefox/comments/11lghex/how_to_check_the_source_code_of_an_extension/)






