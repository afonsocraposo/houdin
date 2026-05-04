# Feature AI Workflow Plan

## Goal
Let users create and refine workflows by chatting with AI directly in the popup, including testing the draft workflow against the active page and using execution history as feedback for the next AI iteration.

## Steps

1. Define the session model
   - Add a `GenerationSession` concept to track:
     - chat messages
     - draft workflow JSON
     - page context snapshot
     - execution references
     - revision number
     - status
   - Decide where to persist it, likely in browser storage alongside workflow state.

2. Add popup AI chat UI
   - Add a chat panel to the popup as the primary creation surface.
   - Support:
     - user prompt input
     - AI responses
     - draft status
     - test/run button
     - save/enable workflow action
   - Keep the config designer optional for advanced editing.

3. Capture page context from the active tab
   - Add a popup action to request context from the content script.
   - Capture compact data only:
     - URL
     - title
     - selected text
     - visible relevant elements
     - optional selected element selector
   - Reuse this context in the AI prompt.

4. Add AI session orchestration in background
   - Use a long-lived message channel for realtime session updates.
   - Background should:
     - receive user prompts
     - call AI
     - validate AI output
     - persist each draft update
     - stream updates back to the popup

5. Make AI output patch-based
   - Have the AI produce incremental workflow edits instead of only final JSON.
   - Each AI turn should update the draft workflow immediately.
   - Keep a revision history so changes can be replayed or reverted.

6. Add the Test button behavior
   - Run the current draft workflow against the active tab.
   - Ensure draft is persisted before execution.
   - Reuse the existing workflow execution engine.
   - Attach execution results back to the same AI session.

7. Feed execution history back into the session
   - After test runs, store:
     - execution id
     - success/failure
     - failed node
     - relevant outputs
     - error summary
   - Include the latest execution data in the next AI prompt.

8. Validate draft workflows before applying
   - Validate AI-produced JSON against `WorkflowDefinition`.
   - Verify node types and connections against registries.
   - Reject invalid edits and surface errors in the popup.

9. Optional designer handoff
   - Add a button in the popup to open the workflow in the designer.
   - Load the live draft session into the designer if the user wants deeper edits.
   - Keep popup-first creation as the default path.

10. Add persistence and recovery
    - Restore an in-progress generation session after popup reopen.
    - Keep draft workflow and chat history available across page refreshes.
    - Make sure users can continue from the last valid revision.

11. Polish UX and error handling
    - Show clear states for:
      - generating
      - testing
      - failed test
      - draft ready
    - Surface short, actionable errors in chat.
    - Keep the popup compact and usable.

## Recommended implementation order
1. Session model and persistence
2. Popup chat UI
3. Page context capture
4. AI orchestration and draft patching
5. Test button and execution feedback
6. Validation and recovery
7. Optional designer handoff
