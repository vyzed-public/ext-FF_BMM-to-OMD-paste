# Firefox Bookmark Manager to Obsidian Markdown (BMM-to-OMD)

## Extension Specification

**Version:** 0.1a
**Date:** 2026-04-18
**Author:** Daniel Cunningham / Claude (Anthropic)

---

## 1. Purpose

A Firefox WebExtension that reads the contents of a user-selected bookmark folder (recursively, including nested subfolders and separators) and copies the result to the clipboard as clean, pasteable Obsidian-style Markdown — ready for direct paste into an Obsidian vault with no post-paste cleanup required.

## 2. Problem Statement

When a user selects bookmarks in Firefox's Bookmark Manager and copies them, the resulting clipboard content is inconsistent and messy when pasted into Obsidian:

- Raw URLs appear instead of markdown links.
- Extra blank lines are inserted between entries.
- Separator lines (`---`) collide with markdown rendering, causing preceding lines to render as implicit headers.
- Nested folder structure is lost entirely.

The current manual workaround involves pasting into Obsidian and running multiple regex find/replace passes using the community Regex Find/Replace plugin (`^\s*$\n(?!---)` to strip blank lines, then `^\s*---\s*$` → `- ---` to fix separators). This is tedious and error-prone.

This extension eliminates the manual cleanup by producing correct Obsidian Markdown directly from the bookmark tree.

## 3. Relationship to Sibling Projects

This extension is part of a family of Firefox extensions for moving bookmark data between Firefox and Obsidian:

| Extension | Direction | Description |
|-----------|-----------|-------------|
| **ext-FF_Tab-to-OMD-paste** | Tab → Clipboard | Clips the current tab's title, URL, and selection as Obsidian Markdown |
| **ext-FF_OMD-to-BMM** | Clipboard → Bookmarks | Imports Obsidian markdown links into Firefox bookmark folders |
| **ext-FF_BMM-to-OMD-paste** | Bookmarks → Clipboard | Copies bookmark folder contents as Obsidian Markdown *(this extension)* |

The folder tree picker UI, persistent folder selection, and ancestor chain fallback logic are reused from ext-FF_OMD-to-BMM. The clipboard write helper and markdown generation module structure are reused from ext-FF_Tab-to-OMD-paste.

## 4. User Workflow

1. User clicks the extension's toolbar icon in Firefox.
2. A popup opens showing a collapsible folder tree picker, pre-populated with the user's full bookmark folder hierarchy.
3. The folder tree auto-selects the last-used folder from the previous session. If that folder has been deleted, the extension walks up the stored ancestor chain and selects the nearest surviving parent.
4. User selects or confirms a source folder from the tree.
5. User clicks the **"Copy as Markdown"** button.
6. The extension reads the selected folder's bookmark tree recursively (subfolders, bookmarks, and separators) and generates Obsidian-style Markdown.
7. The generated Markdown is written to the clipboard.
8. A success flash confirms the copy. The user pastes directly into Obsidian.

## 5. UI Layout (Popup)

```
┌──────────────────────────────────┐
│  BMM-to-OMD                      │
│                                  │
│  Source Folder:                  │
│  ┌──────────────────────────┐    │
│  │ ▾ Bookmarks Toolbar      │    │
│  │   ▸ Web Dev              │    │
│  │   ▸ Tools                │    │
│  │ ▸ Bookmarks Menu         │    │
│  │ ▸ Other Bookmarks        │    │
│  └──────────────────────────┘    │
│  Selected: Web Dev               │
│                                  │
│  ┌──────────────────────────┐    │
│  │    Copy as Markdown      │    │
│  └──────────────────────────┘    │
│                                  │
│  Ready to paste 12 items         │
│                                  │
└──────────────────────────────────┘
```

## 6. Component Details

### 6.1 Folder Tree Picker

- Populated on popup open via `browser.bookmarks.getTree()`.
- Displays the full bookmark folder hierarchy as a collapsible tree with expand/collapse toggle arrows.
- Top-level folders (Bookmarks Toolbar, Bookmarks Menu, Other Bookmarks) start expanded. Subfolders start collapsed.
- Click a folder name to select it (highlighted in purple). Click the toggle arrow to expand/collapse without selecting.
- Shows the currently selected folder name below the tree as confirmation: "Selected: [FolderName]".
- Supports re-selection at any time. The last click wins as the active source.
- **Persistent selection:** The last selected folder is persisted to `browser.storage.local` along with the full ancestor chain of folder IDs. On the next popup open, the extension auto-selects the saved folder and expands its ancestors so it is visible. If the saved folder has been deleted, the extension walks up the ancestor chain and selects the nearest surviving parent folder. This also correctly handles renamed folders since matching is by ID, not name.

### 6.2 Copy as Markdown Button

- **Disabled** until a valid folder is selected in the tree picker.
- On click:
  - Reads the selected folder's contents recursively via `browser.bookmarks.getChildren()` (called recursively for subfolders).
  - Passes the bookmark tree data to the markdown generation module.
  - Writes the resulting Markdown string to the clipboard.
  - Displays a success status message.

### 6.3 Status Area

- Before folder selection: "Select preferred folder"
- After folder selection (pre-copy): "Ready to paste N items" (where N is the recursive count of bookmarks, subfolders, and separators in the selected folder).
- After successful copy: success flash on the container, consistent with ext-FF_Tab-to-OMD-paste.
- On error: displays the error message.

## 7. Markdown Output Format

### 7.1 Root Folder

The selected folder's name appears as a plain text line (no bullet, no link) at the top of the output. All children are indented beneath it as bulleted list items.

### 7.2 Bookmarks

Each bookmark is rendered as a bulleted markdown link:

```markdown
- [Page Title](https://example.com/page)
```

### 7.3 Subfolders

Each subfolder is rendered as a plain text bulleted item (no link). Its children are indented beneath it, recursively:

```markdown
- SubfolderName
  - [Child Bookmark](https://example.com)
  - Nested Subfolder
    - [Deep Bookmark](https://example.com/deep)
```

### 7.4 Separators

Bookmark separators are rendered as bulleted horizontal rules to prevent Obsidian rendering collisions (where a bare `---` after a text line causes the text to render as an implicit header):

```markdown
- ---
```

### 7.5 Indentation

2-space indentation per nesting level, consistent with the visual indentation used in ext-FF_OMD-to-BMM's folder tree rendering.

### 7.6 Complete Example

Given this Firefox bookmark structure:

```
📁 DevOps
   📁 Docker
      🔖 Docker Hub
      🔖 Portainer Docs
      ──────────
      🔖 Docker Compose Ref
   📁 WireGuard
      🔖 WG Quick Start
      🔖 WG Config Guide
   ──────────
   🔖 Ansible Getting Started
```

Selecting "DevOps" and clicking "Copy as Markdown" produces:

```markdown
DevOps
- Docker
  - [Docker Hub](https://hub.docker.com)
  - [Portainer Docs](https://docs.portainer.io)
  - ---
  - [Docker Compose Ref](https://docs.docker.com/compose)
- WireGuard
  - [WG Quick Start](https://www.wireguard.com/quickstart)
  - [WG Config Guide](https://www.wireguard.com/config)
- ---
- [Ansible Getting Started](https://docs.ansible.com/getting-started)
```

## 8. Bookmark Node Type Detection

The `browser.bookmarks` API returns nodes with different shapes depending on their type:

| Node Type | Detection | Has `children` | Has `url` | Has `type` |
|-----------|-----------|----------------|-----------|------------|
| Folder | `node.children` is an array | Yes | No | `"folder"` |
| Bookmark | `node.url` is a string | No | Yes | `"bookmark"` |
| Separator | No `children`, no `url` | No | No | `"separator"` |

The `type` property is available in Firefox's implementation of the bookmarks API. For robustness, the extension should check for `node.type === "separator"` as the primary detection method, with a fallback of "no `children` and no `url`" as secondary detection.

## 9. Permissions Required

| Permission | Reason |
|------------|--------|
| `bookmarks` | Read the bookmark folder tree and folder contents |
| `clipboardWrite` | Write generated Markdown to the clipboard |
| `storage` | Persist last-selected folder ID and ancestor chain |

No additional permissions (tabs, activeTab, clipboardRead, etc.) are required. The extension reads from the bookmarks API and writes to the clipboard; it does not interact with web page content.

## 10. Extension File Structure

```
ext-FF_BMM-to-OMD-paste/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── clipboard.js
│   └── markdown.js
├── docs/
│   └── spec.v01a.extension.bmm2omd.md
├── icons/
│   ├── icon-48.png
│   └── icon-96.png
├── archive/
│   └── issues/
├── .github/
│   └── workflows/
│       └── sync-issues.yml
├── LICENSE
└── README.md
```

### Module Responsibilities

| File | Role |
|------|------|
| `manifest.json` | Extension metadata, permissions, browser action declaration |
| `popup/popup.html` | Popup UI structure |
| `popup/popup.css` | Popup styling (folder tree, button, status area) |
| `popup/popup.js` | Controller: folder tree picker, persistent selection, copy handler |
| `popup/clipboard.js` | Clipboard write helper with `navigator.clipboard` and `execCommand` fallback |
| `popup/markdown.js` | Pure functions: recursive bookmark tree → Obsidian Markdown string |

## 11. Manifest

```json
{
  "manifest_version": 2,
  "name": "BMM-to-OMD Paste",
  "version": "1.0.0",
  "description": "Copy bookmark folder contents as Obsidian-style Markdown, ready to paste.",
  "browser_specific_settings": {
    "gecko": {
      "id": "bmm2omd@vyzed.net"
    }
  },
  "permissions": [
    "bookmarks",
    "clipboardWrite",
    "storage"
  ],
  "browser_action": {
    "default_icon": {
      "48": "icons/icon-48.png",
      "96": "icons/icon-96.png"
    },
    "default_popup": "popup/popup.html",
    "default_title": "BMM-to-OMD: Copy bookmarks as Markdown"
  },
  "icons": {
    "48": "icons/icon-48.png",
    "96": "icons/icon-96.png"
  }
}
```

## 12. Installation

This extension is for personal use and will not be published publicly on AMO. Installation follows the same two-phase approach as ext-FF_OMD-to-BMM.

### 12.1 Development Cycle: Temporary Install via about:debugging

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click "Load Temporary Add-on..."
3. Navigate to the project directory and select `manifest.json`.
4. The extension loads immediately. Its icon appears in the toolbar.

**Edit-test cycle:**

1. Edit source files.
2. Return to `about:debugging#/runtime/this-firefox`.
3. Click "Reload" on the extension.
4. Test via the toolbar popup.

**Limitation:** The extension is removed on Firefox restart. Acceptable during development.

### 12.2 Production Use: Permanent Installation

#### 12.2.1 Recommended: AMO Unlisted Self-Distribution (standard Firefox Release)

```bash
cd ext-FF_BMM-to-OMD-paste/
web-ext build --overwrite-dest
web-ext sign --channel=unlisted \
  --api-key=$AMO_JWT_ISSUER \
  --api-secret=$AMO_JWT_SECRET
```

Install the signed `.xpi` via `about:addons` → gear icon → "Install Add-on From File..."

#### 12.2.2 Alternative: Unsigned Install (Developer Edition / ESR / Nightly)

1. Ensure `manifest.json` includes `browser_specific_settings.gecko.id`.
2. Set `xpinstall.signatures.required` to `false` in `about:config`.
3. Package: `zip -r ../bmm2omd.xpi *`
4. Install via `about:addons` → gear icon → "Install Add-on From File..."

**Note:** `xpinstall.signatures.required` has no effect on Firefox Release or Beta.

## 13. Extension Icon

The extension icon visually suggests the concept of bookmark export/copy. The icon is provided as PNG at two sizes: 48×48 and 96×96 pixels, stored in `icons/icon-48.png` and `icons/icon-96.png`.

## 14. Out of Scope

- Previewing the generated Markdown before copying.
- Creating or modifying bookmarks (use ext-FF_OMD-to-BMM for that).
- Sidebar panel (no bookmarks are created, so there is nothing to verify).
- Tag export (Firefox bookmark tags are not included in the Markdown output).
- Reading from or writing to Obsidian vault files directly (clipboard is the transport).
- Any interaction with TiddlyWiki.
