/* popup.js
 *
 * Controller for the BMM-to-OMD popup UI.
 *
 * Wires together:
 *   - Folder tree picker     (browser.bookmarks API)
 *   - Persistent selection   (browser.storage.local — folder ID + ancestor chain)
 *   - Item counting          (markdown.js — fetchFolderTree, countItems)
 *   - Markdown generation    (markdown.js — buildMarkdownFromFolder)
 *   - Clipboard write        (clipboard.js — copyToClipboard)
 *
 * Flow:
 *   1. Populate folder tree on popup open
 *   2. Restore last-used folder (with ancestor chain fallback)
 *   3. On folder select: count items, update status
 *   4. On copy click: fetch tree, build markdown, copy to clipboard
 *   5. Success flash + status update
 */

(function () {
  "use strict";

  var folderTree = document.getElementById("folder-tree");
  var selectedFolderDisplay = document.getElementById("selected-folder");
  var copyBtn = document.getElementById("copy-btn");
  var statusArea = document.getElementById("status");
  var mainContainer = document.getElementById("mainContainer");

  var selectedFolderId = null;
  var selectedFolderName = null;
  var currentSelectedLabel = null;

  // ── Folder tree picker ─────────────────────────────────────

  async function populateFolders() {
    var tree = await browser.bookmarks.getTree();
    // Render top-level children (Bookmarks Toolbar, Bookmarks Menu, Other Bookmarks)
    tree[0].children.forEach(function (node) {
      if (node.children) {
        folderTree.appendChild(buildFolderNode(node, true));
      }
    });
  }

  function buildFolderNode(node, startExpanded) {
    var div = document.createElement("div");
    div.className = "ft-folder " + (startExpanded ? "ft-expanded" : "ft-collapsed");

    var header = document.createElement("div");
    header.className = "ft-header";

    var toggle = document.createElement("span");
    toggle.className = "ft-toggle";
    header.appendChild(toggle);

    var label = document.createElement("span");
    label.className = "ft-label";
    label.textContent = node.title || "(untitled)";
    label.dataset.folderId = node.id;
    label.dataset.folderName = node.title || "(untitled)";
    header.appendChild(label);

    div.appendChild(header);

    // Children container
    var children = document.createElement("div");
    children.className = "ft-children";
    node.children.forEach(function (child) {
      if (child.children) {
        children.appendChild(buildFolderNode(child, false));
      }
    });
    div.appendChild(children);

    // Toggle expand/collapse
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (div.classList.contains("ft-collapsed")) {
        div.classList.remove("ft-collapsed");
        div.classList.add("ft-expanded");
      } else {
        div.classList.remove("ft-expanded");
        div.classList.add("ft-collapsed");
      }
    });

    // Select folder on label click
    label.addEventListener("click", function (e) {
      e.stopPropagation();
      selectFolder(label);
    });

    return div;
  }

  function selectFolder(label) {
    // Deselect previous
    if (currentSelectedLabel) {
      currentSelectedLabel.classList.remove("selected");
    }
    // Select this one
    label.classList.add("selected");
    currentSelectedLabel = label;
    selectedFolderId = label.dataset.folderId;
    selectedFolderName = label.dataset.folderName;
    selectedFolderDisplay.textContent = "Selected: " + selectedFolderName;
    selectedFolderDisplay.classList.add("active");
    copyBtn.disabled = false;

    // Update item count in status
    updateItemCount();

    // Build the full ancestor chain by walking up the DOM tree
    var ancestorIds = [selectedFolderId];
    var parent = label.closest(".ft-folder");
    if (parent) parent = parent.parentElement.closest(".ft-folder");
    while (parent) {
      var parentLabel = parent.querySelector(":scope > .ft-header > .ft-label");
      if (parentLabel && parentLabel.dataset.folderId) {
        ancestorIds.push(parentLabel.dataset.folderId);
      }
      parent = parent.parentElement.closest(".ft-folder");
    }

    // Persist the selection and full ancestor chain for next time
    browser.storage.local.set({
      lastSelectedFolderId: selectedFolderId,
      lastSelectedAncestorIds: ancestorIds
    });
  }

  async function updateItemCount() {
    if (!selectedFolderId) return;

    try {
      var nodes = await fetchFolderTree(selectedFolderId);
      var count = countItems(nodes);
      var noun = count === 1 ? "item" : "items";
      statusArea.textContent = "Ready to paste " + count + " " + noun;
      statusArea.className = "status ready";
    } catch (err) {
      statusArea.textContent = "Error reading folder: " + err.message;
      statusArea.className = "status error";
    }
  }

  async function restoreLastFolder() {
    var data;
    try {
      data = await browser.storage.local.get(["lastSelectedFolderId", "lastSelectedAncestorIds"]);
    } catch (e) {
      return;
    }

    var ancestorIds = data.lastSelectedAncestorIds || [];
    if (ancestorIds.length === 0 && data.lastSelectedFolderId) {
      ancestorIds = [data.lastSelectedFolderId];
    }
    if (ancestorIds.length === 0) return;

    // Walk the ancestor chain until we find one that still exists in the tree
    for (var i = 0; i < ancestorIds.length; i++) {
      var label = folderTree.querySelector('[data-folder-id="' + ancestorIds[i] + '"]');
      if (label) {
        // Found a surviving folder — expand ancestors and select it
        var parent = label.closest(".ft-folder");
        while (parent) {
          parent.classList.remove("ft-collapsed");
          parent.classList.add("ft-expanded");
          parent = parent.parentElement.closest(".ft-folder");
        }
        selectFolder(label);
        label.scrollIntoView({ block: "nearest" });
        return;
      }
    }

    // Nothing in the chain survived — fall back to no selection
  }

  // ── Copy handler ───────────────────────────────────────────

  copyBtn.addEventListener("click", async function () {
    if (!selectedFolderId || !selectedFolderName) return;

    copyBtn.disabled = true;
    statusArea.textContent = "Copying...";
    statusArea.className = "status";

    try {
      var nodes = await fetchFolderTree(selectedFolderId);
      var md = buildMarkdownFromFolder(selectedFolderName, nodes);

      copyToClipboard(md, function () {
        // Success
        var count = countItems(nodes);
        var noun = count === 1 ? "item" : "items";
        statusArea.textContent = "Copied " + count + " " + noun + " to clipboard";
        statusArea.className = "status ready";
        mainContainer.className = "container success-flash";
      }, function (err) {
        // Clipboard write failed
        statusArea.textContent = "Copy failed: " + (err.message || "unknown error");
        statusArea.className = "status error";
        copyBtn.disabled = false;
      });
    } catch (err) {
      statusArea.textContent = "Error: " + err.message;
      statusArea.className = "status error";
      copyBtn.disabled = false;
    }
  });

  // ── Init ───────────────────────────────────────────────────

  populateFolders().then(restoreLastFolder);
})();
