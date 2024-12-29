---
aliases: "DataAdapter.rmdir"
cssclasses: hide-title
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[`DataAdapter`](DataAdapter) › [`rmdir`](DataAdapter/rmdir)

## DataAdapter.rmdir() method

Remove a directory.

**Signature:**

```typescript
rmdir(normalizedPath: string, recursive: boolean): Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  <code>normalizedPath</code> | <code>string</code> | path to folder, use [normalizePath()](normalizePath) to normalize beforehand. |
|  <code>recursive</code> | <code>boolean</code> | If <code>true</code>, delete folders under this folder recursively, if <code>false</code> the folder needs to be empty. |

**Returns:**

`Promise``<void>`
