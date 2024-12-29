---
aliases: "Workspace.getLeaf_1"
cssclasses: hide-title
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[`Workspace`](Workspace) › [`getLeaf`](Workspace/getLeaf_1)

## Workspace.getLeaf() method

If newLeaf is false (or not set) then an existing leaf which can be navigated is returned, or a new leaf will be created if there was no leaf available.

If newLeaf is `'tab'` or `true` then a new leaf will be created in the preferred location within the root split and returned.

If newLeaf is `'split'` then a new leaf will be created adjacent to the currently active leaf.

If newLeaf is `'window'` then a popout window will be created with a new leaf inside.

**Signature:**

```typescript
getLeaf(newLeaf?: PaneType | boolean): WorkspaceLeaf;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  <code>newLeaf</code> | [`PaneType`](PaneType)<code> &#124; boolean</code> | _(Optional)_ |

**Returns:**

[`WorkspaceLeaf`](WorkspaceLeaf)
