## Publishing Liara Lite (sync to public repo)

You develop in the private repo:
- `C:\Liara\liara-voice-chat` (branch: `liara-lite`)

David pulls from the public repo:
- `https://github.com/KrisandLiara/liara-lite`

These **do not auto-sync**. You “publish” only when you choose.

### One-command publish (recommended)

From the private repo root:

```powershell
.\scripts\publish-lite.ps1
```

Defaults:
- **Source ref**: `liara-lite`
- **Destination folder**: `C:\Liara\liara-lite-public` (a clean working copy)
- **Public repo**: `https://github.com/KrisandLiara/liara-lite.git`
- **Branch**: `main`

### When should you publish?
- After a set of Lite changes you want David to test.
- Not after every local tweak.

### Notes / gotchas
- The script uses `git archive`, so it exports **tracked files only**.
  - Your local `.env`, `import/` outputs, `node_modules`, etc. are not included.
- The script requires a clean working tree by default (safety).
  - If you really want to publish with uncommitted local changes, you can run:

```powershell
.\scripts\publish-lite.ps1 -AllowDirty
```

### Custom usage

```powershell
.\scripts\publish-lite.ps1 -SourceRef liara-lite -PublicRepoUrl https://github.com/KrisandLiara/liara-lite.git -Dest C:\Liara\liara-lite-public -Branch main -Message "Liara Lite v1.0.1"
```

