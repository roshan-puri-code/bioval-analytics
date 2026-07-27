# BioVal Analytics — Life Sciences Commercial Intelligence SaaS

> **Live Application:** [bioval-analytics.vercel.app](https://bioval-analytics.vercel.app/)

BioVal Analytics is an automated commercial intelligence and valuation platform built for life sciences consultants, biopharma strategy teams, and healthcare investors. 

By querying real-time global clinical trial registries, the application calculates risk-adjusted drug valuations (eNPV), maps phase-specific probabilities of success (PoS), and provides indication-matched market access and competitive analysis.

---

## Key Features

* **Real-time Clinical Registry Integration:** Directly queries the **ClinicalTrials.gov v2 REST API** to pull trial status, phase, lead indication, and sponsor metadata.
* **10-Year eNPV Valuation Engine:** Dynamic financial modeling that calculates Base-Case NPV vs. Risk-Adjusted eNPV using phase-weighted probability of success (PoS) algorithms.
* **Interactive Sensitivity Analysis:** Built-in financial controls allowing users to stress-test discount rates, estimated launch years, and peak sales projections.
* **Context-Aware Competitive Mapping:** Automatically matches retrieved indications against market competitors, mapping parent sponsors and approval statuses.

---

## Tech Stack

* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS, Shadcn UI
* **Data Layer:** ClinicalTrials.gov REST API
* **Deployment:** Vercel Hosting & GitHub Integration
