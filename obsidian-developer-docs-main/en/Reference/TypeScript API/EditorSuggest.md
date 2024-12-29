---
aliases: "EditorSuggest"
cssclasses: hide-title
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[`EditorSuggest`](EditorSuggest)

## EditorSuggest class


**Signature:**

```typescript
export abstract class EditorSuggest<T> extends PopoverSuggest<T> 
```
**Extends:** [`PopoverSuggest`](PopoverSuggest)`<T>`

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [`(constructor)(app)`](EditorSuggest/(constructor).md) |  | Constructs a new instance of the <code>EditorSuggest</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [`app`](PopoverSuggest/app) |  | [`App`](App) | <p>(Inherited from [PopoverSuggest](PopoverSuggest)<!-- -->)</p> |
|  [`context`](EditorSuggest/context) |  | [`EditorSuggestContext`](EditorSuggestContext)<code> &#124; null</code> | Current suggestion context, containing the result of <code>onTrigger</code>. This will be null any time the EditorSuggest is not supposed to run. |
|  [`limit`](EditorSuggest/limit) |  | <code>number</code> | Override this to use a different limit for suggestion items |
|  [`scope`](PopoverSuggest/scope) |  | [`Scope`](Scope) | <p>(Inherited from [PopoverSuggest](PopoverSuggest)<!-- -->)</p> |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [`close()`](PopoverSuggest/close) |  | <p>(Inherited from [PopoverSuggest](PopoverSuggest)<!-- -->)</p> |
|  [`getSuggestions(context)`](EditorSuggest/getSuggestions) | <code>abstract</code> | Generate suggestion items based on this context. Can be async, but preferably sync. When generating async suggestions, you should pass the context along. |
|  [`onTrigger(cursor, editor, file)`](EditorSuggest/onTrigger) | <code>abstract</code> | <p>Based on the editor line and cursor position, determine if this EditorSuggest should be triggered at this moment. Typically, you would run a regular expression on the current line text before the cursor. Return null to indicate that this editor suggest is not supposed to be triggered.</p><p>Please be mindful of performance when implementing this function, as it will be triggered very often (on each keypress). Keep it simple, and return null as early as possible if you determine that it is not the right time.</p> |
|  [`open()`](PopoverSuggest/open) |  | <p>(Inherited from [PopoverSuggest](PopoverSuggest)<!-- -->)</p> |
|  [`renderSuggestion(value, el)`](PopoverSuggest/renderSuggestion) | <code>abstract</code> | <p>(Inherited from [PopoverSuggest](PopoverSuggest)<!-- -->)</p> |
|  [`selectSuggestion(value, evt)`](PopoverSuggest/selectSuggestion) | <code>abstract</code> | <p>(Inherited from [PopoverSuggest](PopoverSuggest)<!-- -->)</p> |
|  [`setInstructions(instructions)`](EditorSuggest/setInstructions) |  |  |
