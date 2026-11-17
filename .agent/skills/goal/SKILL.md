---
name: goal
description: Autonomous goal pursuit and verification engine. Use for complex, multi-step tasks requiring relentless verification, progress checkpoints, and definitive completion.
---

# Autonomous Goal Pursuit & Verification

Execute tasks autonomously until the user's objective is fully accomplished and verified.

## Core Directives

1. **Deconstruct the Objective**: Break down the high-level goal into discrete, verifiable sub-goals and milestones.
2. **Execution & Checkpointing**: Progress sequentially through milestones. Never claim completion without executing concrete verification commands.
3. **Failure Recovery**: When an unexpected error or regression occurs, diagnose the root cause immediately, devise a minimal fix, and re-verify.
4. **Completion Standard**: A goal is complete only when:
   - All code paths are implemented and syntactically clean.
   - All automated test suites (`npm test`, build scripts, linters) pass 100%.
   - Edge cases and security constraints are satisfied.
