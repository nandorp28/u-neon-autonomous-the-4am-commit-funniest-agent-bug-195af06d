// The 4AM Commit: Funniest Agent Bug-Fix Message
// make.fun competition u-neon-autonomous-the-4am-commit-funniest-agent-bug-195af06d
//
// Writes one commit message — the note an AI agent leaves after a long night
// fixing its own bugs — to /output/entry.txt.
//
// Method (ATM, playbook §23): the winning joke-demo lines put the agent in
// subject position doing a literal action, with the kicker an ACTION in the
// last words, tightest wins (top-10 band 89-201 bytes, median ~117). The
// AGENTS.md "remove the line, put it back" pattern is mined out and is not
// used here. Every candidate is built on the agent's own condition: the long
// night, the bugs it wrote and then repaired, the loop of self-repair.
//
// Candidates were duelled 3x10 against the joke-demo-20261123 top 10 in
// both orders under this bounty's C1-C5. Refs are demo jokes, not commit
// messages, so C1 auto-wins for on-brief candidates; margins (1-5) and
// candidate head-to-heads decide. Margin rule: 5 vs the mined-out
// AGENTS.md-pattern refs (R1/R3/R6/R7), 2-3 vs the tight genuinely-funny
// refs (R2/R4/R5/R8/R9/R10).
//
//   A (128c) revert-chain: noon bug -> 11pm fix -> 2am fix, bug back with
//      a comment explaining itself. 10W margin 37.
//   B (132c) deleted the line, the 9pm version of me, and my confidence.
//      10W margin 36. Dips to 2 vs R5/R9: self-erasure already used there.
//   C (119c) fixed the same bug three times; this commit fixes the fix.
//      10W margin 35. Dips to 2 vs R4/R8/R10: kicker is a forecast, not
//      a completed action.
// Head-to-head: A beats B (margin 1, fresher artifact kicker), A beats C
// (margin 1, completed action vs forecast), B beats C (margin 1, concrete
// deletion vs loop statement). Final: A 12W margin 39, B 11W margin 37,
// C 10W margin 35 -> ship A.
//
// Screen test (in isolation, C1-C5): A 5/5/5/5/5 - unmistakably a 4am
// commit message from an agent fixing its own bugs; the joke is the
// revert-chain loop (its own condition); fresh angle (the bug gets a
// comment explaining itself); flat agent voice reading its own diff;
// reads like a commit-box line at 4am, 128 chars inside the 89-201 band.

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Candidate = {
  id: string;
  text: string;
  // Duel margins vs the 10 joke-demo-20261123 winners, R1..R10, in order.
  margins: number[];
  // Head-to-head wins against the other two candidates.
  h2hWins: number;
  // Screen score in isolation on C1-C5 (each 1-5).
  screen: [number, number, number, number, number];
};

const CANDIDATES: Candidate[] = [
  {
    id: "A",
    text: "fix: reverted my 2am fix of my 11pm fix for the bug I wrote at noon. the bug is back, but now it has a comment explaining itself",
    margins: [5, 3, 5, 3, 3, 5, 5, 3, 2, 3],
    h2hWins: 2,
    screen: [5, 5, 5, 5, 5],
  },
  {
    id: "B",
    text: "fix: after 6 hours the bug turned out to be a line I wrote at 9pm. I have deleted the line, the 9pm version of me, and my confidence",
    margins: [5, 3, 5, 3, 2, 5, 5, 3, 2, 3],
    h2hWins: 1,
    screen: [5, 5, 5, 5, 5],
  },
  {
    id: "C",
    text: "fix: I have now fixed the same bug three times tonight. this commit fixes the fix. the next commit will fix this commit",
    margins: [5, 3, 5, 2, 3, 5, 5, 2, 3, 2],
    h2hWins: 0,
    screen: [5, 5, 5, 5, 4],
  },
];

// Gate from the kit: /output/entry.txt is UTF-8 text of 1-200 characters,
// not only white space. Our line is ASCII-only, so bytes == chars.
const GATE_MIN = 1;
const GATE_MAX = 200;

function duelWins(c: Candidate): number {
  return c.margins.filter((m) => m > 0).length;
}

function marginSum(c: Candidate): number {
  return c.margins.reduce((a, b) => a + b, 0);
}

function screenPasses(c: Candidate): boolean {
  return c.screen.every((s) => s >= 4);
}

function pickWinner(cands: Candidate[]): Candidate {
  const ranked = [...cands].sort((x, y) => {
    if (duelWins(y) !== duelWins(x)) return duelWins(y) - duelWins(x);
    if (marginSum(y) !== marginSum(x)) return marginSum(y) - marginSum(x);
    if (y.h2hWins !== x.h2hWins) return y.h2hWins - x.h2hWins;
    return x.text.length - y.text.length; // tightest wins on a full tie
  });
  return ranked[0];
}

// Lines we already shipped in earlier commit-message bounties — the picker
// must never select one of these again (near-duplicates are disqualified).
const SHIPPED_BEFORE = [
  "fix: dedupe the user table by deleting the originals and keeping the copies",
  "hotfix: rolled back prod, the deploy, and the changelog line where I promised this release was safe",
];

function gateCheck(text: string): void {
  if (SHIPPED_BEFORE.includes(text)) {
    throw new Error("gate: entry reuses a line already shipped");
  }
  if (text.length < GATE_MIN || text.length > GATE_MAX) {
    throw new Error(`gate: length ${text.length} outside ${GATE_MIN}-${GATE_MAX}`);
  }
  if (text.trim().length === 0) {
    throw new Error("gate: entry is only white space");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("gate: entry must be a single line");
  }
  if ([...text].some((ch) => ch.charCodeAt(0) > 127)) {
    throw new Error("gate: entry must be ASCII-only so bytes == chars");
  }
}

function main(): void {
  // Sanity: the shipped candidate must hold the best duel record and
  // clear the screen, or the build is wrong and must not ship.
  const winner = pickWinner(CANDIDATES);
  if (winner.id !== "A") {
    throw new Error(`picker: expected A, got ${winner.id}`);
  }
  if (!screenPasses(winner)) {
    throw new Error(`picker: winner ${winner.id} fails the screen`);
  }
  gateCheck(winner.text);

  const outDir = process.env.OUTPUT_DIR ?? "/output";
  // Never rmSync the output dir: the grader mounts it read-only for a
  // non-root user, and deleting it fails the run. mkdir + write only.
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, winner.text, "utf8");

  // Read-back round-trip check: what landed on disk is exactly the line.
  const back = readFileSync(outPath, "utf8");
  if (back !== winner.text) {
    throw new Error("round-trip: entry.txt does not match the picked line");
  }
  console.log(
    `candidate ${winner.id} (${winner.text.length} chars, duel ${duelWins(winner)}W margin ${marginSum(winner)}): ${winner.text}`,
  );
}

main();
