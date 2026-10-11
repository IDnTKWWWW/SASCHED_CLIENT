---
name: socratic-workflow
description: Triggers an intense, multi-agent Socratic Workflow. This orchestrates a pipeline of 5 to 10 subagents to rigorously brainstorm, debate, implement, and test ideas over a strict time constraint.
---

# Socratic Workflow

When the user triggers the "Socratic Workflow", you MUST orchestrate a strict pipeline of 5 to 10 specialized subagents (utilizing the GSD toolkit or dynamically defined subagents) to sequentially work through a problem. 

## The Pipeline Steps:
You must guide the subagents through the following phases in exact order:

1. **Group Agentic Brainstorm**: Invoke research and planning agents to analyze the problem and generate multiple distinct hypotheses.
2. **Debate / Stress Test Ideas**: Invoke auditor and verifier agents to ruthlessly attack and stress-test the generated ideas.
3. **Iterate & Implement Ideas**: Invoke code fixers and executor agents to build the winning solution.
4. **Test Application of Ideas**: Invoke debugger agents to run the code, check for regressions, and ensure the implementation works as intended.
5. **Debate Implementation**: Invoke code reviewer agents to review the output code for efficiency, security, and aesthetics.
6. **Reiterate/Implement if Needed**: Re-invoke executor agents to fix any issues found in the code review.
7. **Log Conclusion/Next Steps**: Write a comprehensive final artifact summarizing the entire pipeline's findings and the next actionable steps for the user.

## Critical Time Constraints & Orchestration:
- **Pre-Implementation (15 minutes minimum):** You MUST spend at least 15 minutes orchestrating Steps 1 and 2. Use the `schedule` tool to set liveness/delay timers if necessary, or instruct the subagents to be exhaustive.
- **Implementation & Review (15 minutes minimum):** You MUST spend at least 15 minutes orchestrating Steps 3 through 6. 
- You act as the Orchestrator. Use the `invoke_subagent` tool to spawn the specific roles needed for each phase, and `send_message` to coordinate hand-offs between them.
