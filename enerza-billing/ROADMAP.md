# Enerza Billing Platform: Roadmap & Next Steps

This document tracks the remaining roadmap phases after completing the intensive Q1 (Power MDM & Workflows) and Q2 (FI-CA) sprints.

## Q3: Deep Utility Specifics (Pending)
- [ ] **Water Utility (NRW)**: Implement Non-Revenue Water logic, comparing bulk meter readings at supply zones to aggregated consumption at the customer level to track leaks/theft.
- [ ] **Gas Utility (APM/LNG)**: Incorporate complex gas constraints such as Administered Pricing Mechanism quotas and LNG blend ratios in the billing configuration.
- [ ] **Advanced Power Metrics**: Generate native CERC/SERC compliancy reports based on TOD profiles and Power Factor compliance.

## Q4: Integrations & Automation (Pending)
- [ ] **Automated Payment Webhooks**: Map the `webhook_subscription` and `api_transactions` to a live payment gateway (e.g. Razorpay / Stripe dummy endpoints) to reconcile `payment_orders` automatically.
- [ ] **Background Batch Processing**: Convert the "Simulated" Dunning Check into an actual chron-job server process that iterates through past-due bills nightly using Next.js route handlers or a Node worker.
- [ ] **Full Data Seeding for FI-CA**: Expand `seed.ts` to populate thousands of mock `BudgetBillingPlans` and `SecurityDeposits` to test the UI metrics at maximum scale.
