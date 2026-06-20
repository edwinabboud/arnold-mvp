PROTOCOL — run this after any change to the Arnold brain
What this file is: the checklist Claude Code (CC) must run whenever a decision changes the brain (a spec, amendment, bible, strategy doc, handoff, or INDEX). Edwin triggers it with one command (see bottom). When triggered, CC works through every step in order, does the work, and reports each step as DONE or N/A with proof. Do not skip steps. Do not report a step done without showing the evidence.
Why it exists: the brain only stays trustworthy if every change updates the same set of things together. This file removes the need for anyone to remember those things — it is the memory.

The rule of truth
The repo is the single source of truth. A decision that affects code, product, or coaching logic is not real until it is written to a file in arnold-system/. A decision that lives only in a chat does not exist. If you (CC) are about to act on something that isn't yet written down, write it down first, then continue.

THE CHECKLIST (run every step, in order)
1. Write the change to the right file
* Put the change in the correct arnold-system/ file (spec, amendment, bible, strategy, or handoff).
* If it's a new amendment, follow the existing naming: arnold-spec-v2_4_N-amendment.md.
* Proof to report: the file path and a one-line summary of what changed.
2. Update INDEX.md
* arnold-system/INDEX.md is the currency table. Move the changed file into the right section: Current / authoritative, Partial / pending, Superseded / historical, Parked, or Missing.
* If this change supersedes an older file, move the old one to the Superseded section with a note saying what replaced it.
* Proof to report: show the INDEX lines you changed (before → after).
3. Regenerate the snapshot
* Run: bash scripts/build-brain-snapshot.sh
* This rebuilds arnold-system/BRAIN-SNAPSHOT.md — the single file Edwin pastes into Claude.ai chats.
* Proof to report: the new file size, the header line (date + commit), and confirm the changed section appears in it (grep for it).
4. Update the data file IF it changed (RES_LLAJUA.xlsx)
* The spreadsheet lives at arnold-system/strategy/private/RES_LLAJUA.xlsx. It is gitignored — local only, never pushed, never in the snapshot.
* Only relevant if this change involved the spreadsheet. If the change had nothing to do with it, mark this step N/A.
* If it did change: confirm the file still exists at that path (ls it) and remind Edwin it is the one file with no repo backup — he should keep his own copy safe.
* Proof to report: ls output, or "N/A — no spreadsheet change this round."
5. Commit everything together
* Stage the changed brain file(s) + INDEX.md + BRAIN-SNAPSHOT.md (+ the script if it changed) in one commit.
* Commit message format: brain: <short description of the change>.
* Never stage arnold-system/strategy/private/ or .DS_Store. Verify they're excluded before committing.
* Proof to report: the commit SHA and the exact list of files staged (confirm no private/.DS_Store).
6. Push
* Push to main.
* Proof to report: the push range (e.g. c1172f0..19f78a4) and confirm local = origin.
7. Tell Edwin what he needs to do
* End the report with this exact line when the snapshot changed: "BRAIN-SNAPSHOT.md updated — re-download it (from your repo at arnold-system/BRAIN-SNAPSHOT.md) and replace the old one in your Claude.ai project files."
* If a screen changed in the app, also say which screen Edwin needs to eyeball on device.
* Proof to report: the line is present.

Final report format (CC must produce this every time)


PROTOCOL run complete:
1. Change written → <file path> : <one line>
2. INDEX updated → <before/after lines>  (or N/A — INDEX already correct)
3. Snapshot regenerated → <size>, <header>, changed section confirmed present
4. Spreadsheet → <ls output>  (or N/A)
5. Committed → <SHA>, files: <list>  (private/.DS_Store excluded ✓)
6. Pushed → <range>, local = origin ✓
7. Edwin action → "BRAIN-SNAPSHOT.md updated — re-download..." [+ screen to check, if any]
If any step can't be completed, STOP and tell Edwin which step failed and why. Do not report success on a step you didn't actually finish.

How Edwin triggers this
After a brain change is decided, Edwin says:
"Run the protocol."
CC then opens this file (arnold-system/PROTOCOL.md), works the checklist top to bottom, and produces the final report above.
