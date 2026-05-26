# Tool Availability And Fallback Matrix

Version: 1.0
Last Updated: 2026-05-02
Status: active
Owner: technical-validation-agent
Change History: see `CHANGELOG.md`.

Purpose: define the required runtime tools, verified availability method, failure mode, and safe fallback for the Digital PR journalist-email workflow.

Status: active.

Mandatory rule: if a tool is unavailable, blocked, unverified, or inaccessible, do not invent results. Write `Information unavailable. Verification required before use.` and follow the fallback below.

| Tool / Dependency | Workflow Purpose | Availability Check | Known Current Result | Failure Mode | Safe Fallback | Manual Action Required |
|---|---|---|---|---|---|---|
| PowerShell | Run local `.ps1` and `.cmd` workflow scripts | `$PSVersionTable.PSVersion` | Available in Windows shell | Parser/runtime failure | Run parser validation, repair script, rerun | No, unless shell is unavailable |
| Portable Node | Run local JavaScript workflow scripts | `D:\Codex Folder\.tools\node-v24.15.0-win-x64\node.exe --version` | Available as portable runtime | Global `node.exe` may be denied | Use portable Node explicitly in commands and validators | No |
| Global Node | Optional convenience runtime | `node.exe --version` | May return `Access is denied` | Script fails if relying on PATH | Use portable Node path | No |
| Bundled Python | Run skill validators and audit scripts | `C:\Users\fahmi\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe --version` | Available | Python missing from PATH | Use bundled Python exact path | No |
| File system access | Read/write workflow files | `Get-ChildItem` and direct file reads | Available | Long Muck Rack output paths can exceed normal PowerShell handling | Exclude archived long-path folders or use `\\?\` paths for validation | No |
| JSON validation | Validate data and captured outputs | Python JSON parse with long-path support | Available | Long paths or malformed JSON | Use Python `\\?\` prefix and repair malformed files | No |
| PowerShell validation | Validate command syntax and safety | PowerShell parser APIs | Available | Broken variables or unsafe commands | Repair script and rerun parser | No |
| Chrome debug browser | Use visible/debug Chrome for Muck Rack and browser research | `Invoke-RestMethod http://127.0.0.1:9222/json/version` | Must be checked per run | Debug endpoint unavailable | Run `.\scripts\launch-debug-chrome.cmd`; if still unavailable, mark browser workflow manual | Yes, if Chrome cannot launch |
| SERP research | Search Google/news/source pages | Browser or web search check | Available only when browser/web access works | Search page blocked, unreachable, or untested | Use documented query strings and mark results unavailable until verified | Yes, if no browser/web search is available |
| Advanced SERP search | Site, filetype, exact-match, date, academic, government, local, competitor searches | Query execution evidence | Must be checked per campaign | Operators not tested or source pages blocked | Record queries only; do not use claims until verified | Yes, if live search cannot run |
| Boolean search | Build SERP and Muck Rack query strings | Query review against Boolean rules | Available as prompt/script logic | Query too narrow or unsupported | Broaden with OR clusters, geography, beat terms, and exclusions | No |
| Muck Rack access | Collect journalist targets and coverage | Login/search/profile access in debug Chrome | Blocked unless login/session/search is verified | Browser verification, missing login, blocked search, inaccessible profiles | Use exported/manual captures, SERP/outlet contact pages, newsroom directories, and mark Muck Rack unavailable | Yes, if Muck Rack login/search remains blocked |
| Email deliverability review | Check subject/body risk and plain-text safety | `email-optimizer` rubric and audit script | Available | Spammy wording or broken format | Rewrite and rerun audit | No |
| Dataset parsing | Extract claims from pasted source or job files | `draft-study-input` and validators | Available | Missing, messy, conflicting, or proxy data | Downgrade claims, caveat, request verified source | No, unless source is absent |
| Report generation | Package final audit/job output | `final-doc-packager` audit and export scripts | Available locally; Google export depends on OAuth | OAuth missing or Google API blocked | Produce Markdown package and mark Drive export manual | Yes, if OAuth is missing or invalid |

## Required Fallback Discipline

1. Never treat a tool instruction as a completed result.
2. Never claim browser, SERP, advanced SERP, Boolean, or Muck Rack success without captured evidence.
3. If Muck Rack is blocked, continue only with verified exports, public SERP/outlet pages, or manual captures.
4. If Chrome debug is unavailable, run `.\scripts\launch-debug-chrome.cmd` and recheck the debug endpoint before attempting Muck Rack automation.
5. If global Node is denied, use `D:\Codex Folder\.tools\node-v24.15.0-win-x64\node.exe`.
6. If Python is not on PATH, use `C:\Users\fahmi\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`.
7. If any required evidence remains unavailable, write `Information unavailable. Verification required before use.`
