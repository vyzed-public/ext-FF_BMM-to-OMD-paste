# Bookmark Round-Trip Format Specification

## Overview

Three tools form a bookmark round-trip ecosystem between Firefox and Obsidian:

1. **Tab-to-OMD** — Clips a Firefox tab (title, URL, selected text) into Obsidian-style markdown
2. **OMD-to-BMM** — Imports Obsidian markdown bookmarks into Firefox Bookmark Manager
3. **BMM-to-OMD** — Exports Firefox Bookmark Manager entries back into Obsidian markdown

The goal is **format stability**: after a full cycle (Tab-to-OMD → Obsidian → OMD-to-BMM → Firefox → BMM-to-OMD → Obsidian), the markdown should be identical to what went in.

## Experiments

After some use of the bookmarking extention ecosystem, we realized we need to deal with this problem:

> Let's look at these results from one cycle.

> We used `Tab-to-OMD` to collect to three or four different bookmarks.
> Then we used `OMD-to-BMM` to paste them into Firefox bookmark manager.
> Then we used `BMM-to-OMD` to base them into Obsidian again.

> Observe that the formats have changed.
> Understand that we don't want that.

...and, after a bunch of extraneous chat & experiments, we concluded:

> The chain of authority should be:
> `OMD-to-BMM` — works correctly, respects Firefox BMM structure, (especially separators), so don't touch it
> `Tab-to-OMD` — defines the canonical format (bullet + em-dash + 2-space indent)
> `BMM-to-OMD` — should be updated to output that same canonical format

> So when `BMM-to-OMD` exports from Firefox back to Obsidian, instead of outputting 4-space indented child bullets for links, it should output 2-space indented em-dashes. That way the round-trip is format-stable.

## Canonical Format

Tab-to-OMD defines the canonical output format. All three tools must respect it.

### Structure

```
- {purpose_or_selection}
  — [{link_title}]({url})
```

### Rules

- **Folder line:** `- ` (bullet + space) followed by purpose text or `?` placeholder
- **Bookmark line:** two-space indent + `— ` (em-dash + space) + standard markdown link
- **Separator between entries:** single blank line (trailing `\n` after the bookmark line)
- **Em-dash is U+2014** (not a hyphen, not an en-dash)

### Structural Semantics

| Markdown element | Firefox BMM mapping | Obsidian rendering |
|---|---|---|
| `- text` (bullet) | Folder | Bullet point |
| `  — [title](url)` (indented em-dash) | Bookmark inside the folder above | Indented attribution line |

**Critical:** The em-dash distinguishes a bookmark payload from a subfolder. A child bullet (`  - [title](url)`) would be interpreted as a subfolder by OMD-to-BMM, breaking the nesting structure.

### Examples

**With selected text:**
```
- How to implement LLM-Wiki with opencode and llama.cpp, all tricks included
  — [LLM-wiki local & local LLM: part 2 | by Fabio Matricardi | Medium](https://medium.com/artificial-intel-ligence-playground/llm-wiki-local-locall-llm-part-2-88ecfa2cf6c2)
```

**Without selected text (? placeholder):**
```
- ?
  — [LLM-wiki local & local LLM: part 2 | by Fabio Matricardi | Medium](https://medium.com/artificial-intel-ligence-playground/llm-wiki-local-locall-llm-part-2-88ecfa2cf6c2)
```

**Multiple bookmarks pasted sequentially:**
```
- imagine we're a tiny ant living on the surface of a doughnut.
  — [The Fundamental Group](https://joeclaxton.substack.com/p/the-fundamental-group)

- PAI is a Life Operating System
  — [PAI — Magnifying Human Capabilities](https://ourpai.ai/)

- Agentic AI Infrastructure for magnifying HUMAN capabilities.
  — [danielmiessler/Personal_AI_Infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure)
```

## Current State (as of 2026-04-23)

| Tool | Status | Issue |
|---|---|---|
| **Tab-to-OMD** | ✅ Conforms | Outputs canonical format |
| **OMD-to-BMM** | ✅ Conforms | Correctly parses em-dash as bookmark, bullet as folder |
| **BMM-to-OMD** | ❌ Non-conforming | Outputs 4-space indented child bullets instead of 2-space indented em-dashes |

## Required Change: BMM-to-OMD

BMM-to-OMD currently outputs:

```
    - imagine we're a tiny ant living on the surface of a doughnut.
        - [The Fundamental Group](https://...)
```

It should output:

```
- imagine we're a tiny ant living on the surface of a doughnut.
  — [The Fundamental Group](https://...)
```

Changes needed:
1. **Link lines:** Replace `- [` (child bullet) with `— [` (em-dash attribution)
2. **Indent width:** 2 spaces per level instead of 4
3. **Base indent:** Start at column 0 (the parent folder context is provided by where the user pastes, not by leading whitespace)

## Why This Matters

Without format stability, each round-trip cycle mutates the markdown:
- Em-dashes become bullets
- Indent widths change
- Nesting depth drifts

After 2-3 cycles the structure becomes unrecognizable. Format stability means you can freely move bookmarks between Firefox and Obsidian without degradation.
