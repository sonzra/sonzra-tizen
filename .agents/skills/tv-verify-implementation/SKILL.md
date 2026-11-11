---
name: tv-verify-implementation
description: >-
  Verifies and validates implemented features against Sonzra Tizen quality gates: runs
  type checks, executes Vitest spatial navigation suites, verifies bin/quality, inspects
  10-foot UI/UX compliance, validates Tizen packaging readiness, and commits the finalized work.
---

# Sonzra TV Verification Skill (`tv-verify-implementation`)

The `tv-verify-implementation` skill owns the **entire verification, testing, quality gating, and packaging validation lifecycle** after feature implementation in `sonzra-tizen`.

> [!IMPORTANT]
> **Calling Contract & Failure Policy:**
> - **Zero Tolerance:** No commit or release completion occurs until all gates pass with 100% green status.
> - **Fail Fast:** If any gate fails (TypeScript errors, test failures, focus traps), produce structured diagnostics and halt for remediation.

---

## 1. Execution Workflow

```mermaid
flowchart TD
    Handoff["Implemented TV Code"] --> PreFlight["1. Pre-Flight Inspection\n(git status, diff)"]
    PreFlight --> BuildCheck["2. TypeScript & Build Check\n(npm run build)"]
    BuildCheck --> BuildPass{"Build Passes (Exit 0)?"}
    BuildPass -->|No| FailHalt["Halt & Report Build Errors"]
    
    BuildPass -->|Yes| TestCheck["3. Run Test Suites\n(npm test)"]
    TestCheck --> TestPass{"100% Tests Pass?"}
    TestPass -->|No| FailHalt
    
    TestPass -->|Yes| QualityGate["4. Run Quality Gate\n(bin/quality)"]
    QualityGate --> GatePass{"Gate Passes (Exit 0)?"}
    GatePass -->|No| FailHalt
    
    GatePass -->|Yes| PackagingAudit["5. Package & Signature Audit\n(deploy-tv.sh dry-run or wgt test)"]
    PackagingAudit --> AdvisorCheck{"Advisor Audit Needed?"}
    AdvisorCheck -->|Yes: Spatial / UX Check| ConsultAdvisors["Consult tv-architect-advisor / tv-ui-ux-advisor"]
    ConsultAdvisors --> Commit["6. Git Commit & Documentation Update"]
    AdvisorCheck -->|No| Commit
    Commit --> Report["7. Deliver Verification Report"]
```

---

## 2. Verification Procedure

### Step 1: Pre-Flight Audit
Inspect modified files:
```bash
git status
git diff --stat
```

### Step 2: Build & Type Check
Verify zero TypeScript compilation errors and clean asset generation:
```bash
npm run build
```

### Step 3: Run Vitest Suites
Ensure all spatial navigation and unit tests pass:
```bash
npm test
```

### Step 4: Quality Gate
Run canonical project quality gate:
```bash
bin/quality
```

### Step 5: Cross-Project Parity Audit (sonzra-tizen -> sonzra)
Before committing any TV feature, audio buffering fix, or API integration in `sonzra-tizen`:
1. **Assess Sister Impact**: Determine if this fix, audio streaming detail, or backend endpoint requirement affects the main `sonzra` server or web app.
2. **File Issue if Applicable**: If a sister backend issue, schema gap, or web player fix is needed, file an issue on `sonzra/sonzra` using `gh`:
   ```bash
   gh issue create -R sonzra/sonzra \
     --title "[Parity] <Description of TV requirement or bugfix>" \
     --body "..."
   ```

### Step 6: Git Commit
Commit with a conventional commit message:
```bash
git add -A
git commit -m "feat(tv): <description of changes>"
```
