---
aliases: "FileManager.renameFile"
cssclasses: hide-title
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[`FileManager`](FileManager) › [`renameFile`](FileManager/renameFile)

## FileManager.renameFile() method

Rename or move a file safely, and update all links to it depending on the user's preferences.

**Signature:**

```typescript
renameFile(file: TAbstractFile, newPath: string): Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  <code>file</code> | [`TAbstractFile`](TAbstractFile) | the file to rename |
|  <code>newPath</code> | <code>string</code> | the new path for the file |

**Returns:**

`Promise``<void>`
