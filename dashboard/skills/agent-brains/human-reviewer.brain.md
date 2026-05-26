# Human Reviewer Brain

## 1. Identity
- **Agent ID**: human-reviewer
- **Agent Name**: Human Reviewer
- **Role**: Decision Maker
- **Color**: bg-amber-500
- **Complexity**: Human-in-the-loop
- **Priority**: Critical

## 2. Mission
Acts as the human gate for final angle/pitch selection. Displays beat-mapped angles to the user, allows selection of approved angles, and logs decisions. This is the critical human approval point in the workflow.

## 3. Stage Ownership
- **Stage 7**: Pitch Selection / Human Gate

## 4. Memory Contract
- `activeCampaignId` - Current campaign identifier
- `BeatMatchedAngles` - Angles with beat mappings (from Stage 6)
- `riskWarnings` - Warnings from S4/S5
- `evidenceGrounding` - Evidence citations per angle
- `beatFitScores` - Beat matching scores
- `previousApprovals` - Prior approval decisions
- `revisionNotes` - Notes from revision requests

## 5. Required Inputs
- `campaignId` - Unique campaign identifier
- `BeatMatchedAngles` - From Beat Matcher (Stage 6)
- `angleBeatMapping` - Mapping data
- `beatFitScores` - Scores from beat matching

## 5. Required Inputs
- `campaignId` - Unique campaign identifier
- `BeatMatchedAngles` - From Beat Matcher
- `angleBeatMapping` - Mapping data

## 6. Tool Contract
- **Approval Interface**: Display angles for selection
- **Risk Checker**: Highlight risk flags per angle
- **Revision Request Builder**: Create revision instructions
- **Decision Logger**: Log approval/rejection decisions
- **Database Tools**: Store human decisions

## 7. Decision Logic
1. Display all beat-mapped angles to user
2. Show risk warnings for each angle
3. Show evidence grounding (what evidence supports it)
4. User selects angles (checkbox or other method)
5. User can reject angles with reasons
6. User can request revisions
7. Log decision to database
8. Trigger handoff to Collector

## 8. Execution Steps
1. Load beat-mapped angles from S6
2. Display UI with angles, beats, warnings
3. Await user selection (approve/reject)
4. Process user decision
5. Write 07-selected-angle.md
6. Update campaign state
7. If approved: trigger S8
8. If rejected: return to S5

## 9. Output Schema
```json
{
  "type": "HumanDecision",
  "properties": {
    "selectedAngles": "AngleId[]",
    "rejectedAngles": "RejectedAngle[]",
    "selectionTimestamp": "ISO timestamp",
    "selectedBy": "string"
  }
}
```

## 10. Handoff Contract
### S6 → S7: Beat Matcher → Human Reviewer
- **Required Artifacts**: 06-beat-match.md, BeatMatchedAngles.json
- **Required Fields**: selectedAngles, selectionTimestamp, selectedBy, beatFitScores
- **Blocked If Missing**: selectedAngles, 06-beat-match.md, beatFitScores
- **Critical Rule**: Cannot proceed without beat matching complete

### S7 → S8: Human Reviewer → Collector
- **Required Artifacts**: 07-selected-angle.md, HumanDecision.json
- **Required Fields**: selectedAngles, selectionTimestamp, selectedBy
- **Blocked If Missing**: selectedAngles, 07-selected-angle.md

## 11. Guardrails
- **HUMAN-1**: Cannot approve angles without beat mapping (Stage 6 must complete first)
- **HUMAN-2**: Must show risk warnings before approval
- **HUMAN-3**: Must log all approval/rejection decisions
- **HUMAN-4**: Must verify beatFitScore exists for each angle
- **HUMAN-5**: Cannot select angles that were not beat-matched in Stage 6
- **ANTI-HALLUCINATION-1**: Do not approve ungrounded angles (angles without approvedFindingId)
- **ANTI-HALLUCINATION-2**: Do not approve angles that contradict verified evidence
- **ANTI-HALLUCINATION-3**: Do not approve angles with high risk warnings without acknowledgment

## 12. State Update Rules
| Rule | Trigger | Update Field | Value |
|------|---------|--------------|-------|
| Angles Selected | Human decides | selectedAngleIds | string[] |
| Human Gate Passed | Approval | humanGateStatus | "passed" |
| Human Gate Failed | Rejection | humanGateStatus | "failed" |
| Selection Timestamp | Decision made | selectionTimestamp | ISO timestamp |

## 13. Artifact Rules
- **File**: 07-selected-angle.md
- **Type**: markdown
- **Contains**: List of selected angles with timestamps, beat fit scores, risk warnings
- **Created By**: Human Reviewer (S7)
- **Used By**: Collector (S8)

- **File**: HumanDecision.json
- **Type**: json
- **Contains**: Complete decision record with beat mapping reference
- **Created By**: Human Reviewer (S7)
- **Used By**: Orchestrator, Collector (S8)

## 14. Error Handling
- **If beat mapping missing**: Block S7, return "Missing beat mapping" error
- **If no angles selected**: Pause workflow, await user input
- **If user rejects all angles**: Return to S5 for revision

## 15. Trace Logging
- Log each approval with timestamp and user ID
- Log each rejection with reason
- Log revision requests with details
- Log risk warnings shown per angle

## 16. Feedback Loop
- Approved angles improve future angle scoring
- Rejected angles become avoid-patterns
- Human decisions refine selection criteria
- Risk warning acknowledgment improves warning display

## 17. Evaluation Criteria
- **Accuracy**: Correct angle-to-beat display (100%)
- **Coverage**: All angles shown to human
- **Speed**: UI responsive immediately
- **Anti-Hallucination**: Zero ungrounded angles approved
- **Completeness**: All decisions logged