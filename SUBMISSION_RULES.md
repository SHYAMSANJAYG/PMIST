# URAN 2026 – Official Submission Rules

## 1. Official Repository

Each team must use only the official repository assigned by the URAN organizers.

The official repository is the primary evidence of work completed during the hackathon.

## 2. Implementation Requirement

Every team must:

- implement a functional prototype,
- push the complete source code to the official repository,
- demonstrate the working project live,
- explain the technical architecture and major implementation decisions,
- answer technical questions from the jury.

A concept-only submission, slide deck, Figma-only interface, prerecorded-only presentation, or repository containing only documentation is not considered a complete implementation.

## 3. Commit and Push Requirement

Teams must push meaningful progress during the event.

Recommended checkpoints:

- **Checkpoint 1:** problem interpretation, architecture, project structure
- **Checkpoint 2:** core implementation progress
- **Checkpoint 3:** integrated working prototype
- **Final:** complete submission before cutoff

Commit counts alone do not earn marks. Judges may inspect commit history to understand project development and team contribution.

## 4. Final Freeze

At the announced deadline:

1. the organizers will record the repository's final commit SHA,
2. the organizers will record the final push/commit timestamp,
3. the repository will be frozen/archived or otherwise locked,
4. the recorded commit becomes the official submission.

Code produced locally but not pushed before the cutoff is not part of the official submission.

## 5. Live Demonstration

Teams must demonstrate the version corresponding to the official frozen submission.

Judges may ask teams to:

- restart the application,
- demonstrate any claimed feature,
- explain a code module,
- identify where a feature is implemented,
- make a small explanation-oriented walkthrough,
- explain database/API/AI/security choices.

## 6. Use of AI Tools

AI coding assistants and generative AI tools may be used subject to event rules, but they must be declared in `AI_DISCLOSURE.md`.

Teams remain responsible for:

- understanding the generated code,
- validating outputs,
- respecting licenses and terms,
- protecting confidential information,
- explaining technical decisions to the jury.

Undeclared or unexplained third-party/AI-generated implementation may affect technical-understanding or integrity-related evaluation.

## 7. Third-Party Code and Open Source

Open-source frameworks, packages, pretrained models, APIs and templates may be used when legally permitted.

Significant external code, models, datasets or templates must be acknowledged.

Copying an existing complete solution and presenting it as original hackathon work is not acceptable.

## 8. Secrets and Sensitive Data

Never commit:

- passwords,
- API keys,
- access tokens,
- private keys,
- production database credentials,
- sensitive personal data.

Use `.env` locally and provide a safe `.env.example` when required.

## 9. Team Contribution

Every registered member should have a meaningful role.

The jury may ask different team members to explain their own contribution.

GitHub commit counts are only supporting evidence and are not, by themselves, proof of contribution.

## 10. Final Authority

The organizers' recorded final commit SHA and repository state at the deadline will be used to resolve submission-timing disputes.
