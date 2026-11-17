---
name: plan
description: Strategic architecture, dependency mapping, and phased execution planning for complex software projects. Use before undertaking non-trivial implementations or refactoring.
---

# Strategic Architecture & Phased Execution Planning

Formulate comprehensive, verifiable plans before executing large-scale changes.

## Planning Protocol

1. **Scope Boundary**: Clearly define what is in scope and explicitly state what is deferred or skipped (following YAGNI principles).
2. **Current State Analysis**: Map all callers, affected modules, configuration files, and downstream dependencies.
3. **Phased Milestones**:
   - Phase 1: Architectural analysis & risk modeling.
   - Phase 2: Core engine & logic implementation.
   - Phase 3: Integration, tooling, and CLI bindings.
   - Phase 4: Automated verification, regression testing, and sign-off.
4. **Verification Gates**: Every phase must define an unambiguous command-line test or gate that proves the phase succeeded.
