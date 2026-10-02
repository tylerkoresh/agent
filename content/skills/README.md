# Real catalog

Put one YAML (or JSON) file per Skill here, then run:

    npm run catalog:validate
    npm run catalog:import -- --dry-run
    npm run catalog:import

Required before `status: published`: fullDescription, creatorName, sourceUrl,
licenseSpdx (use NOASSERTION if the source states none), and at least one agent with
evidence. `verification: verified` additionally needs `lastTestedAt` and an agent with
`evidence: tested`. Third-party Skills stay `distribution: link_only`.
