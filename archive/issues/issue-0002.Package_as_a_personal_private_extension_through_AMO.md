# #2: Package: as a personal private extension through AMO

**State:** OPEN
**Author:** vyzed
**Created:** 2026-04-18T04:47:39Z

---


## The TL;DR: 

### Guidance doc (markdown, not a dumb-ass MS doc): 
* **[AMO Submissions: Errors, Gotchas, and Arcana](https://github.com/vyzed-public/ext-FF_BMM-to-OMD-paste/blob/main/docs/guidance.AMO-submissions.errors-and-arcana.md)**

Key prerequisite: add `data_collection_permissions` to `manifest.json` before submission (see guidance doc §2.1).

---

### Previous History:

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

