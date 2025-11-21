# Review Packet — Chapter 2 Phase 0 (Tightening Gate)

**Project:** training-hamza  
**Branch:** `chore/chapter2-phase0-tightening`  
**Date:** 2025-11-21  
**Author:** Hamza

---

## Scope & Links

Phase 0 is a **tightening gate** that cleans up rough edges from Chapter 1 before proceeding to Chapter 2. This ensures all CLIs follow consistent patterns and have proper integration test coverage.

**Tasks Completed:**
1. ✅ Fix Hello CLI usage text alignment (cli.js + README.md)
2. ✅ Add CLI-level integration tests for Hello CLI

**Pull Request:** [To be created with needs-review-packet label]

**Reference:**
- Chapter 1 Capstone: `docs/review-packet-capstone.md`
- Hello CLI Tests: `tests/hello.test.js`
- Hello CLI Implementation: `src/hello/cli.js`

---

## Before / After Summary

### Problem Statement

**Issue 1: Inconsistent Usage Text**
- The Hello CLI error message showed `node cli.js` instead of the actual invocation path
- This misalignment confused users about the correct way to run the CLI

**Issue 2: Missing CLI-Level Tests**
- While core functions had 6 unit tests, there were no integration tests for the CLI wrapper
- No verification that error messages, usage text, and exit codes worked correctly when invoked as a process

### Changes Made

#### 1. Usage Text Alignment

**File:** `src/hello/cli.js` (line 30)

**Before:**
```javascript
console.error('Usage: node cli.js --name <name> [--shout]');
```

**After:**
```javascript
console.error('Usage: node src/hello/cli.js --name <name> [--shout]');
```

**File:** `READMe.md` (line 288)

**Before:**
```
Usage: node cli.js --name <name> [--shout]
```

**After:**
```
Usage: node src/hello/cli.js --name <name> [--shout]
```

#### 2. CLI Integration Tests

**File:** `tests/hello.test.js`

**Added:**
- New test suite: `Hello CLI Integration` with 3 tests
- Tests use `execSync` to run the actual CLI as a subprocess
- Validates error messages, usage text, exit codes, and output formatting

**Tests Added:**
1. **Missing --name flag** → Exits with code 1, shows error + usage
2. **Valid --name** → Exits with code 0, outputs greeting
3. **Valid --name + --shout** → Exits with code 0, outputs SHOUTED greeting

**Test Count:**
- Before: 44 tests (6 hello unit tests)
- After: 47 tests (6 hello unit tests + 3 hello CLI integration tests)

---

## CI Snapshot

```
✓ tests/temperature.test.js (24 tests) 22ms
✓ tests/stopwatch.test.js (13 tests) 15ms
✓ tests/hello.test.js (9 tests) 1690ms
    ✓ should exit with non-zero code and show correct error when --name is missing  725ms
    ✓ should output greeting when --name is provided  704ms
✓ tests/sanity.test.js (1 test) 16ms

Test Files  4 passed (4)
     Tests  47 passed (47)
```

**All 47 tests passing** ✅

---

## Diff Summary

**Files Changed: 3**

1. **src/hello/cli.js** (1 line changed)
   - Line 30: Updated usage text to show correct invocation path

2. **READMe.md** (1 line changed)
   - Line 261: Updated usage example to match CLI output

3. **tests/hello.test.js** (41 lines added)
   - Added `execSync` import from `child_process`
   - Added new test suite: `Hello CLI Integration` with 3 tests

**Impact:**
- ✅ All usage text now matches actual CLI invocation
- ✅ CLI behavior verified at integration level
- ✅ No breaking changes to existing functionality
- ✅ Test coverage increased: 44 → 47 tests

---

## Rubric & Self-Assessment

| Criteria | Weight | Score | Notes |
|----------|--------|-------|-------|
| **Correct Usage Text** | 25% | 25/25 | ✅ Both cli.js and README.md updated |
| **CLI Integration Test** | 35% | 35/35 | ✅ 3 tests cover error, success, and shouting cases |
| **Exit Codes** | 15% | 15/15 | ✅ Tests verify exit code 1 on error, 0 on success |
| **Error Messages** | 15% | 15/15 | ✅ Tests verify both error and usage text appear |
| **CI Green** | 10% | 10/10 | ✅ All 47 tests passing |

**Total: 100/100**

---

## Evidence & Artifacts

### Test Output (Full)

```bash
npm test

> training-hamza@1.0.0 test
> vitest run

 RUN  v4.0.10 C:/Users/MATRIXCOMPUTER/Desktop/Maximus/training-hamza

 ✓ tests/temperature.test.js (24 tests) 22ms
 ✓ tests/stopwatch.test.js (13 tests) 15ms
 ✓ tests/hello.test.js (9 tests) 1690ms
     ✓ formatGreeting
       ✓ should return a normal greeting when shout is false
       ✓ should return a normal greeting when shout is not provided
       ✓ should return an uppercase greeting when shout is true
       ✓ should throw an error when name is missing
       ✓ should throw an error when name is empty string
       ✓ should throw an error when name is only whitespace
     ✓ Hello CLI Integration
       ✓ should exit with non-zero code and show correct error when --name is missing  725ms
       ✓ should output greeting when --name is provided  704ms
       ✓ should output shouted greeting when --name and --shout are provided  261ms
 ✓ tests/sanity.test.js (1 test) 16ms

 Test Files  4 passed (4)
      Tests  47 passed (47)
   Start at  11:25:50
   Duration  7.68s
```

### Verified Behavior

**Error Case (Missing --name):**
```bash
$ node src/hello/cli.js --shout
Error: --name argument is required
Usage: node src/hello/cli.js --name <name> [--shout]
$ echo $LASTEXITCODE
1
```

**Success Case (Normal):**
```bash
$ node src/hello/cli.js --name Alice
Hello, Alice!
$ echo $LASTEXITCODE
0
```

**Success Case (Shouting):**
```bash
$ node src/hello/cli.js --name Bob --shout
HELLO, BOB!
$ echo $LASTEXITCODE
0
```

---

## Mentor Decision

**Status:** ⏳ Awaiting review  
**Branch:** `chore/chapter2-phase0-tightening`  
**PR Label:** `needs-review-packet`

---

## Notes

This phase demonstrates **tightening discipline**: going back to fix rough edges before moving forward. The changes are minimal but impactful:

1. **Alignment** — Usage text now matches reality
2. **Coverage** — CLI wrapper is now integration-tested, not just the core functions
3. **Quality Gate** — All tests pass, no regressions

This ensures Chapter 2 work builds on a solid foundation.
