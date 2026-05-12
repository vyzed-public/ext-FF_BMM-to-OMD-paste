/* markdown.js
 *
 * Pure functions for converting a Firefox bookmark tree
 * into Obsidian-style Markdown.
 *
 * The main entry point is buildMarkdownFromFolder(), which takes
 * a folder name and an array of bookmark nodes (from browser.bookmarks
 * API) and returns a complete Markdown string ready for clipboard.
 *
 * ── Separator Convention ──────────────────────────────────────────
 *
 * Firefox bookmark separators are visual/structural dividers within
 * a folder — a quick alternative to creating a named subfolder.
 *
 * Obsidian's `---` is a semantic element (thematic break / HR) that
 * interacts badly with markdown rendering:
 *   - A bare `---` after a text line triggers "setext heading"
 *     behavior, turning the preceding line into an <h2>.
 *   - `- ---` inside a bulleted list is not reliably rendered
 *     by Obsidian as a visible divider.
 *
 * To avoid these issues, we represent Firefox separators using a
 * unicode box-drawing line character: ─────  (U+2500, BOX DRAWINGS
 * LIGHT HORIZONTAL, repeated 5×).
 *
 * This is:
 *   - Visually distinct as a divider
 *   - Semantically inert to Obsidian's markdown parser
 *   - Reliably detectable by a regex or parser for round-trip
 *     conversion back to Firefox separators
 *
 * ROUND-TRIP NOTE: The sibling extension ext-FF_OMD-to-BMM should
 * be updated to detect `─────` (or any run of U+2500 characters)
 * in pasted markdown and convert them back to Firefox bookmark
 * separators via browser.bookmarks.create({ type: "separator" }).
 * This is tracked as a future issue on the OMD-to-BMM repo.
 * ──────────────────────────────────────────────────────────────────
 */

/* Unicode separator string: 5× BOX DRAWINGS LIGHT HORIZONTAL (U+2500).
 * Used instead of markdown `---` to avoid Obsidian rendering conflicts.
 * Keep this constant in sync with the detection pattern in OMD-to-BMM
 * if/when round-trip support is implemented. */
var SEPARATOR_MARKER = "\u2500\u2500\u2500\u2500\u2500  separator  \u2500\u2500\u2500\u2500\u2500";

/**
 * Recursively fetch all children of a bookmark folder,
 * building a nested tree structure.
 *
 * Each node from browser.bookmarks.getChildren() is flat,
 * so we must recurse into subfolders to get their children.
 *
 * IMPORTANT: getChildren() does NOT populate node.children —
 * that property only exists on nodes returned by getTree().
 * This means folders and separators both lack .url AND .children,
 * so we must check node.type first (Firefox always provides it)
 * to distinguish them reliably.
 *
 * @param {string} folderId - The bookmark folder ID to read
 * @returns {Promise<Array>} - Array of nodes with nested children
 */
async function fetchFolderTree(folderId) {
    var children = await browser.bookmarks.getChildren(folderId);
    var result = [];

    for (var i = 0; i < children.length; i++) {
        var node = children[i];

        if (node.type === "separator") {
            /* Separator — must check before folder fallback,
               because getChildren() returns flat nodes without
               a .children property, so separators and folders
               both lack .url and .children. */
            result.push({ type: "separator" });
        } else if (node.type === "folder" || (!node.url && !node.type)) {
            /* Subfolder: recurse to get its children */
            var subChildren = await fetchFolderTree(node.id);
            result.push({
                type: "folder",
                title: node.title || "(untitled)",
                children: subChildren
            });
        } else if (node.url) {
            /* Bookmark */
            result.push({
                type: "bookmark",
                title: node.title || node.url,
                url: node.url
            });
        }
    }

    return result;
}

/**
 * Count the total number of items (bookmarks, subfolders, separators)
 * in a nested tree structure.
 *
 * @param {Array} nodes - Array of tree nodes from fetchFolderTree()
 * @returns {number} - Total item count
 */
function countItems(nodes) {
    var count = 0;

    for (var i = 0; i < nodes.length; i++) {
        count++;
        if (nodes[i].type === "folder" && nodes[i].children) {
            count += countItems(nodes[i].children);
        }
    }

    return count;
}

/**
 * Build an Obsidian-style Markdown string from a folder name
 * and its nested tree of bookmark nodes.
 *
 * Output format:
 *   FolderName                (root folder, plain text — no bullet)
 *   - SubfolderName           (subfolder, indented child bullet)
 *     - [Title](url)          (bookmark, bullet link)
 *     - NestedSubfolder       (nested subfolder)
 *       - [Title](url)        (nested bookmark)
 *     - ─────                 (separator, unicode box-drawing line)
 *
 * Uses 2-space indentation per nesting level.
 * Root folder is plain text (no bullet) so OMD-to-BMM treats it as
 * the destination folder name rather than a nested item.
 * Bookmarks use a standard `-` bullet; the markdown link syntax
 * `[Title](url)` distinguishes them from plain subfolder entries.
 * Trailing newline appended for clean paste behavior.
 *
 * @param {string} folderName - The root folder's display name
 * @param {Array} nodes - Array of tree nodes from fetchFolderTree()
 * @returns {string} - Complete Markdown string
 */
function buildMarkdownFromFolder(folderName, nodes) {
    var lines = [];

    /* Root folder name as plain text (no bullet) — OMD-to-BMM treats
     * the first line as the destination folder name, not a nested item. */
    lines.push(folderName);

    /* Render children at depth 1 — subfolders become indented children of root */
    renderNodes(nodes, 1, lines);

    return lines.join("\n") + "\n";
}

/**
 * Recursively render bookmark nodes into markdown lines.
 *
 * @param {Array} nodes - Array of tree nodes
 * @param {number} depth - Current indentation depth (0 = root level)
 * @param {Array} lines - Accumulator array of output lines
 */
function renderNodes(nodes, depth, lines) {
    var indent = "";
    for (var d = 0; d < depth; d++) {
        indent += "  ";
    }

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];

        if (node.type === "bookmark") {
            lines.push(indent + "- [" + node.title + "](" + node.url + ")");
        } else if (node.type === "separator") {
            /* Unicode box-drawing separator — see file header for rationale */
            lines.push(indent + "- " + SEPARATOR_MARKER);
        } else if (node.type === "folder") {
            lines.push(indent + "- " + node.title);
            if (node.children && node.children.length > 0) {
                renderNodes(node.children, depth + 1, lines);
            }
        }
    }
}

