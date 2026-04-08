# Comprehensive Business Requirements Document: Utility Customer, Billing, Metering, Field Service, Maintenance, and Complaint Management Platform

## Document status

This document is a **replacement and expansion** of the earlier draft, not a minor amendment.[cite:51][cite:56] It is intended to serve as a comprehensive, country-neutral BRD with a tabular requirements catalogue followed by detailed requirement narratives so that the document can be used for vendor evaluation, scope definition, functional design, and traceability setup.[cite:47][cite:48][cite:51]

## Document purpose

This BRD defines the business requirements for an integrated utility platform covering customer lifecycle, service lifecycle, billing, collections, meter and device management, smart metering integration, customer service, complaints, field service, maintenance, spares, analytics, controls, and integration.[cite:45][cite:54][cite:57] The document is product-neutral, but it is written in a way that allows evaluation of leading platforms such as SAP IS-U aligned solutions, Oracle Utilities suites, MDMS products, field-service platforms, and other enterprise utility software.[cite:32][cite:34][cite:45]

## Scope statement

The target solution shall support a regulated electric distribution utility that manages residential, commercial, industrial, public, and special-category customers across multiple service territories, channels, and field operating conditions.[cite:45][cite:54][cite:57] The solution shall support both conventional and smart-meter operating models and shall allow localization through configurable tariffs, SLA rules, notices, taxes, levies, and customer classifications rather than hardcoded country logic.[cite:33][cite:34][cite:57]

## Business principles

- Customer, service, and device lifecycles shall be modeled explicitly and historically.[cite:45][cite:54]
- Billing shall support both standard tariff processing and edge cases such as minimum billing, proration, rebills, and final billing.[cite:45][cite:57]
- Customer service, complaints, field work, and maintenance shall operate as connected processes rather than isolated modules.[cite:45][cite:54]
- Smart metering, MDMS, and remote-service capabilities shall be supported without excluding non-smart-meter environments.[cite:33][cite:34][cite:39]
- Requirements shall be uniquely identified so they can be traced into design, testing, and delivery governance.[cite:47][cite:48][cite:56]

## Business entity model

The core business entities in scope are customer, account, premise, service point, contract or service agreement, meter or device, communication module, usage or read record, tariff, bill, payment, complaint or case, work order, asset, outage event, inventory item, and organizational unit.[cite:32][cite:39][cite:45] The solution shall preserve effective-dated relationships across these entities so the utility can determine who held service responsibility, what device was installed, what tariff was active, and what bill logic applied at any given date.[cite:39][cite:45][cite:46]

## Requirement catalogue

The table below is the primary tabular requirement list for the BRD.[cite:47][cite:48][cite:56] Each requirement has a unique ID to support traceability into functional specifications, solution design, SIT, UAT, and vendor scoring.[cite:48][cite:49][cite:56]

| Req ID | Module | Requirement summary | Priority | Notes |
|---|---|---|---|---|
| BR-001 | Customer master | Maintain unified customer records for individual and organizational customers with effective-dated history. [cite:45] | Must | Customer 360 foundation |
| BR-002 | Customer master | Support merge, split, duplicate resolution, and identity-linked customer governance. [cite:45][cite:54] | Must | Data quality critical |
| BR-003 | Account management | Support multiple accounts per customer and multiple premises per customer. [cite:45] | Must | Multi-service reality |
| BR-004 | Service lifecycle | Support new connection request lifecycle from application to activation. [cite:45] | Must | Standard utility onboarding |
| BR-005 | Service lifecycle | Support move-in at existing premise with opening read and new-account activation. [cite:45][cite:46] | Must | Explicitly required |
| BR-006 | Service lifecycle | Support move-out with final read, final bill, deposit settlement, and closure. [cite:23][cite:46] | Must | Explicitly required |
| BR-007 | Service lifecycle | Support tenant change, owner-tenant change, and customer-to-customer transfer on same service point. [cite:46] | Must | Explicitly required |
| BR-008 | Service lifecycle | Support temporary disconnection, permanent disconnection, reconnection, and service closure. [cite:23][cite:46] | Must | Collections and service ops |
| BR-009 | Service lifecycle | Support opt-in and opt-out for programs, meter types, billing programs, and service options. [cite:39][cite:45] | Should | Program flexibility |
| BR-010 | Contract management | Maintain service agreements, deposits, payment arrangements, and effective-dated contractual terms. [cite:45] | Must | Revenue governance |
| BR-011 | Premise/service point | Maintain premise and service-point hierarchy with historical responsibility tracing. [cite:45][cite:46] | Must | Core utility model |
| BR-012 | Meter/device master | Maintain serialised meter and device master with status, specifications, and lifecycle state. [cite:39][cite:42] | Must | Device traceability |
| BR-013 | Device lifecycle | Support installation, commissioning, operation, removal, replacement, decommissioning, and scrap. [cite:38][cite:39][cite:42] | Must | Full lifecycle |
| BR-014 | Device pairing | Support communication-module pairing and provisioning for smart devices where required. [cite:39][cite:42] | Must | Smart meter operations |
| BR-015 | Meter reading | Support manual, handheld, imported, smart, estimated, substitute, and corrected reads. [cite:33][cite:34][cite:39] | Must | Multiple read channels |
| BR-016 | Meter reading | Support image capture as reading evidence during field meter reading. [cite:41][cite:44] | Must | Audit and quality |
| BR-017 | Meter reading | Support image-recognition-assisted meter reading validation workflows. [cite:44] | Should | Advanced field capability |
| BR-018 | Meter exceptions | Support validation and exception handling for zero, reverse, high/low, no-access, and tamper-related reads. [cite:20][cite:33][cite:39] | Must | Revenue assurance |
| BR-019 | Smart metering | Integrate with HES/AMI/MDMS for reads, interval data, alarms, and command responses. [cite:33][cite:34][cite:39] | Must | Smart grid readiness |
| BR-020 | Smart metering | Support remote connect, disconnect, and reconnect where device capabilities permit. [cite:33][cite:39] | Must | Remote service ops |
| BR-021 | Smart metering | Support device-health, communication-loss, tamper, and event-driven workflows. [cite:33][cite:34][cite:39] | Must | Event management |
| BR-022 | Tariffs | Support configurable fixed, block, step, demand, seasonal, and time-based tariffs. [cite:45][cite:57] | Must | Billing flexibility |
| BR-023 | Billing | Support prepaid and postpaid billing on one enterprise platform. [cite:45][cite:57] | Must | Utility-standard capability |
| BR-024 | Billing | Support proration for move-in, move-out, tariff changes, and device replacement. [cite:20][cite:45] | Must | Lifecycle billing |
| BR-025 | Billing | Support estimated bills, corrected bills, rebills, and bill cancellations. [cite:20][cite:45] | Must | Exception handling |
| BR-026 | Billing | Support final bill, opening bill, transfer bill, and settlement bill scenarios. [cite:23][cite:46] | Must | Customer transfer completeness |
| BR-027 | Billing | Support taxes, levies, subsidies, rebates, penalties, and configurable charge components. [cite:45][cite:57] | Must | Country-neutral configuration |
| BR-028 | Billing | Support minimum billing, minimum charge, and minimum demand logic. [cite:20][cite:21] | Must | Explicitly required |
| BR-029 | Billing | Support bill explanation and transparency of tariff and minimum-billing logic for service agents. [cite:20][cite:27] | Must | Customer trust |
| BR-030 | Payments | Support multi-channel payment posting, reversal, suspense, and reconciliation. [cite:23][cite:45][cite:54] | Must | Meter-to-cash core |
| BR-031 | Receivables | Support deposits, deposit transfer, deposit refund, and offset against final bills. [cite:23][cite:46] | Must | Move-out support |
| BR-032 | Collections | Support arrears ageing, collections strategy, promise-to-pay, and disconnection triggers. [cite:20][cite:23] | Must | Credit control |
| BR-033 | Customer service | Provide dedicated customer service workspace for inquiries, service requests, callbacks, and account review. [cite:25][cite:27][cite:54] | Must | Separate from billing ops |
| BR-034 | Complaints | Support formal complaint and dispute management with taxonomy, ownership, and resolution workflow. [cite:17][cite:25] | Must | Regulated utility need |
| BR-035 | Complaints | Support SLA targets, breach alerts, and escalation paths by complaint type and customer class. [cite:17][cite:25] | Must | Service-time control |
| BR-036 | Complaints | Link complaints to bills, payments, reads, device events, images, and work orders. [cite:17][cite:27][cite:44] | Must | End-to-end resolution |
| BR-037 | Field service | Generate field work from service requests, complaints, meter events, and maintenance plans. [cite:17][cite:22][cite:38] | Must | Orchestration |
| BR-038 | Field service | Support scheduling, dispatch, appointments, route planning, and mobile execution. [cite:38][cite:41] | Must | Operational efficiency |
| BR-039 | Field service | Support offline mobile execution with GPS, photo, image, checklist, and signature capture. [cite:38][cite:41] | Must | Low-connectivity support |
| BR-040 | Field service | Record unsuccessful visit reasons and rescheduling workflows. [cite:41] | Must | Real-world field operations |
| BR-041 | Spares/inventory | Support issue, consumption, return, and reconciliation of spares and consumables against work orders. [cite:38][cite:42] | Must | Utility field realism |
| BR-042 | Spares/inventory | Track van stock, technician stock, warehouse stock, and serialized inventory. [cite:38][cite:42] | Must | Material control |
| BR-043 | Device replacement | Support governed faulty-device and upgrade replacement process with old/new device traceability. [cite:38][cite:39][cite:42] | Must | Essential utility process |
| BR-044 | Device replacement | Trigger billing and service updates when device replacement affects active billing cycle. [cite:20][cite:39] | Must | Revenue impact |
| BR-045 | Asset maintenance | Support preventive, corrective, and condition-based maintenance. [cite:17][cite:22] | Must | Reliability |
| BR-046 | Asset maintenance | Maintain asset hierarchy, inspection plans, defect capture, and failure history. [cite:17][cite:22] | Must | EAM core |
| BR-047 | Outage linkage | Display outage context in customer-service and complaint workflows. [cite:22][cite:27] | Must | Avoid duplicate dispatch |
| BR-048 | Outage linkage | Cluster no-supply complaints against known incidents. [cite:22] | Must | Better triage |
| BR-049 | Reporting | Provide operational, management, compliance, and audit reporting. [cite:19][cite:57] | Must | Governance |
| BR-050 | Reporting | Track KPIs for billing, collections, service levels, device health, and field performance. [cite:17][cite:20][cite:39] | Must | Performance management |
| BR-051 | Integration | Integrate with ERP, GIS, payment channels, CRM, MDMS, HES, outage systems, and identity services. [cite:24][cite:33][cite:34] | Must | Enterprise fit |
| BR-052 | Security | Support RBAC, maker-checker, and full audit trail for sensitive transactions. [cite:19][cite:23] | Must | Control framework |
| BR-053 | Configurability | Support effective-dated master data and configurable tariffs, SLAs, notices, and tax or levy structures. [cite:20][cite:25][cite:57] | Must | Country neutrality |
| BR-054 | Compliance | Support regulator-oriented notices, reporting, and evidence retention without hardcoded local logic. [cite:19][cite:25][cite:57] | Must | Regulatory readiness |
| BR-055 | Non-functional | Support high-volume billing, payment spikes, and outage-driven complaint peaks. [cite:22][cite:54] | Must | Scale |
| BR-056 | Non-functional | Support modular suite deployment across CIS, MDMS, CRM, FSM, and EAM components. [cite:32][cite:34][cite:54] | Must | Product-neutral architecture |

## Detailed requirements

### 1. Customer, account, premise, and service-point management

The solution shall maintain a unified and auditable model linking customer, account, premise, service point, and service agreement so that the utility can determine service responsibility over time.[cite:45][cite:46][cite:54] It shall support individuals, organizations, multiple relationships, shared premises, and historical ownership or tenancy changes without breaking billing or service traceability.[cite:45][cite:46]

Detailed requirements:

- The system shall create and maintain customer master records with configurable business and demographic attributes.[cite:45]
- The system shall maintain multiple contacts, addresses, identity references, and communication preferences per customer.[cite:25][cite:45]
- The system shall support duplicate detection, merge, split, and controlled correction of customer records.[cite:45][cite:54]
- The system shall support multiple accounts per customer and multiple premises or service points per account where utility policy allows.[cite:45]
- The system shall maintain premise and service-point hierarchies with effective-dated assignment to accounts and service agreements.[cite:45][cite:46]
- The system shall provide a customer 360 view across service, billing, payments, complaints, devices, and field history.[cite:24][cite:27][cite:54]

### 2. Service lifecycle management

The solution shall explicitly support the full utility service lifecycle rather than limit the process model to “new connection.”[cite:45][cite:46] It shall manage service responsibility changes at a premise or service point without losing history, including same-day handover from one customer to another.[cite:46]

Detailed requirements:

- The system shall support new service application, approval, field fulfilment, activation, and first billing.[cite:23][cite:29]
- The system shall support move-in at an existing service point with opening read and effective-dated responsibility start.[cite:46]
- The system shall support move-out with final read, final bill, service-end date, deposit adjustment, and closure steps.[cite:23][cite:46]
- The system shall support tenant change, owner-to-tenant shift, tenant-to-tenant shift, and customer-to-customer service transfer on the same meter or service point.[cite:46]
- The system shall support temporary suspension, permanent disconnection, reconnection, and closure processes.[cite:23][cite:46]
- The system shall support opt-in and opt-out for programs such as prepaid enrollment, service plan participation, or meter program categories where offered.[cite:39][cite:45]
- The system shall support service upgrade, downgrade, tariff migration, and capacity or load change processes.[cite:45][cite:57]

### 3. Contract, deposits, and financial relationship management

The solution shall maintain service agreements and related financial obligations with effective dates, policy rules, deposits, and payment arrangements.[cite:45][cite:54] These functions are essential for customer transfers, move-outs, and dispute resolution.[cite:23][cite:46]

Detailed requirements:

- The system shall create, amend, renew, suspend, and terminate service agreements with version history.[cite:45]
- The system shall manage deposits, additional deposit requests, deposit transfers, deposit refunds, and final-bill offsets.[cite:23][cite:46]
- The system shall support installment plans, payment arrangements, and promise-to-pay tracking.[cite:20][cite:23]

### 4. Meter and device lifecycle management

The solution shall support meters and related utility devices as serialised lifecycle objects, not just billing input points.[cite:39][cite:42] It shall preserve device installation, pairing, operation, replacement, and decommissioning history with customer, premise, and billing impact.[cite:38][cite:39][cite:42]

Detailed requirements:

- The system shall maintain meter and device master data including serial number, type, manufacturer, rating, multiplier, communication type, firmware, ownership, and warranty details.[cite:39][cite:42]
- The system shall support device receiving, storage, installation, commissioning, operation, removal, replacement, decommissioning, and scrapping.[cite:38][cite:39][cite:42]
- The system shall support pairing of communication modules and other associated device components for smart-meter use cases.[cite:39][cite:42]
- The system shall maintain effective-dated installation history and relationship to customer, account, service point, and asset records.[cite:39][cite:46]

### 5. Meter reading and read validation

The solution shall support multiple read acquisition models and validation patterns because utilities often operate a mixed estate of manual and smart devices.[cite:33][cite:34][cite:39] Read capture shall support operational evidence and exception management, especially in disputed-bill scenarios.[cite:20][cite:44]

Detailed requirements:

- The system shall support manual, handheld, imported, remotely collected, estimated, substitute, corrected, and interval-based reads.[cite:33][cite:34][cite:39]
- The system shall capture read source, type, timestamp, user, and validation status.[cite:33][cite:39]
- The system shall support image capture during meter reading and retain the image as auditable evidence.[cite:41][cite:44]
- The system shall support image-recognition-assisted reading where optical extraction can be validated, corrected, or rejected by users.[cite:44]
- The system shall support validation rules for zero, reverse, roll-over, abnormal high, abnormal low, no-access, unreadable display, and tamper-related exceptions.[cite:20][cite:33][cite:39]

### 6. Smart metering, HES, and MDMS integration

The solution shall support advanced metering integration for usage, event, command, and device-health scenarios.[cite:33][cite:34][cite:39] These capabilities are required both for billing and for field or service operations.[cite:33][cite:34]

Detailed requirements:

- The system shall integrate with AMI, HES, and MDMS platforms for validated reads, interval data, alarms, and command responses.[cite:33][cite:34][cite:39]
- The system shall support remote connect, remote disconnect, and remote reconnect when the device and utility policy allow such actions.[cite:33][cite:39]
- The system shall support smart-meter event handling for tamper, communication loss, voltage anomalies, outage indications, low credit, firmware issues, and similar exceptions.[cite:33][cite:34][cite:39]
- The system shall synchronize relevant status across CIS, MDMS, field-service, and inventory or asset systems.[cite:34][cite:39][cite:42]

### 7. Tariffs, billing, and invoice management

The billing engine shall support standard and edge-case utility billing scenarios through configurable, effective-dated rate logic.[cite:45][cite:57] It shall support customer-lifecycle events, corrections, minimum-billing rules, and transparent bill explanation.[cite:20][cite:45]

Detailed requirements:

- The system shall support fixed, service, volumetric, block, step, demand, seasonal, and time-based tariffs.[cite:45][cite:57]
- The system shall support prepaid and postpaid service models within one enterprise process landscape.[cite:45][cite:57]
- The system shall support proration for move-in, move-out, tariff change, service change, and device replacement events.[cite:20][cite:45]
- The system shall support estimated bills, corrected bills, rebills, bill cancellation, reissue, debit notes, and credit notes.[cite:20][cite:45]
- The system shall support opening bills, final bills, transfer bills, and settlement bills.[cite:23][cite:46]
- The system shall support taxes, levies, subsidies, rebates, penalties, and policy-based adjustments as configurable bill components.[cite:45][cite:57]
- The system shall provide a bill explanation view for service staff and dispute handling.[cite:20][cite:27]

### 8. Minimum billing functionality

The solution shall explicitly support minimum billing because many utilities apply a minimum bill or charge independent of actual usage in some tariff classes.[cite:20][cite:21] This logic shall be configurable, explainable, and testable before release.[cite:20][cite:21][cite:57]

Detailed requirements:

- The system shall support minimum fixed bill, minimum charge, minimum demand bill, and minimum-consumption-derived bill structures.[cite:20][cite:21]
- The system shall apply minimum-billing rules by tariff, service agreement type, customer category, contracted capacity, or other configurable conditions.[cite:20][cite:21]
- The system shall support exemptions, waivers, subsidy interactions, and regulator-defined exceptions to minimum billing.[cite:20][cite:25]
- The system shall expose on-bill and agent-view explanations showing how the minimum bill was calculated and triggered.[cite:20][cite:27]

### 9. Payments, receivables, deposits, and collections

The solution shall support the full receivables lifecycle from payment receipt through reconciliation, arrears management, and field-linked enforcement or restoration.[cite:20][cite:23][cite:54] These capabilities are central to meter-to-cash operations.[cite:45][cite:54]

Detailed requirements:

- The system shall accept and post payments from cash, bank, agent, digital wallet, card, and API-driven channels.[cite:23][cite:27]
- The system shall support payment reversal, suspense management, reconciliation, and financial exception handling.[cite:23][cite:54]
- The system shall support arrears ageing, collections segmentation, strategy assignment, and promise-to-pay tracking.[cite:20][cite:23]
- The system shall support disconnection and reconnection triggers and integration with field or remote-service processes.[cite:23][cite:33]
- The system shall support deposits and deposit settlement during move-out or customer transfer scenarios.[cite:23][cite:46]

### 10. Customer service functionality

The solution shall provide a dedicated customer service module because utility CIS value extends beyond billing into customer engagement and service resolution.[cite:45][cite:54] Service agents shall be able to resolve inquiries, raise service requests, explain bills, and track related operational events from one workspace.[cite:25][cite:27]

Detailed requirements:

- The system shall maintain interaction history across call-center, walk-in, email, portal, app, and assisted channels.[cite:25][cite:27]
- The system shall register inquiries separately from formal complaints when business rules require this distinction.[cite:25]
- The system shall support service requests for move-in, move-out, name change, meter inspection, meter replacement, payment arrangement, and visit scheduling.[cite:23][cite:46]
- The system shall support callbacks, reminders, follow-ups, and communication logs for all service interactions.[cite:25][cite:27]
- The system shall show billing, payment, outage, complaint, and field status on the customer service screen.[cite:22][cite:27]

### 11. Complaints, disputes, and service-time management

The solution shall support formal complaints and disputes as governed case records with ownership, SLA clocks, evidence, and escalation.[cite:17][cite:25] Service times shall be configurable and measurable across inquiry, complaint, field response, and closure processes.[cite:17][cite:25]

Detailed requirements:

- The system shall support complaint categories such as billing dispute, no supply, low voltage, faulty meter, payment issue, delayed service, unsafe installation, and poor field conduct.[cite:17][cite:25]
- The system shall support complaint routing based on geography, customer class, severity, service point, feeder, or amount at risk.[cite:17][cite:25]
- The system shall support SLA definitions for response time, attendance time, restoration time, and closure time.[cite:17][cite:25]
- The system shall support pause, resume, breach, and escalation rules for SLA management.[cite:25]
- The system shall link complaints to bills, reads, device events, images, payments, outages, and work orders.[cite:17][cite:27][cite:44]
- The system shall support closure evidence, customer communication record, and reopening rules.[cite:17][cite:25]

### 12. Field service and mobile workforce

The solution shall include strong field-service functionality because utility business execution depends on work dispatch, attendance, proof of work, and exception capture.[cite:38][cite:41] Field service shall support both customer-facing and asset-facing work.[cite:17][cite:22][cite:38]

Detailed requirements:

- The system shall generate work orders or tasks from complaints, service requests, disconnections, reconnections, meter exceptions, campaigns, and maintenance plans.[cite:17][cite:22][cite:38]
- The system shall support scheduling, dispatch, appointment windows, route planning, and technician or crew assignment.[cite:38][cite:41]
- The mobile application shall support offline usage, GPS capture, timestamping, image and photo capture, checklist completion, and customer signature where needed.[cite:38][cite:41]
- The system shall support unsuccessful visit coding and rescheduling workflows.[cite:41]
- The system shall support field evidence for read disputes, replacement completion, connection work, and service restoration.[cite:38][cite:41][cite:44]

### 13. Spares, materials, and inventory support

The solution shall explicitly support field and maintenance material usage because device operations depend on meters, seals, communication modules, breakers, cable accessories, and repair items.[cite:38][cite:42] This may be delivered directly or through ERP integration, but it shall be in scope as a business requirement.[cite:24][cite:38]

Detailed requirements:

- The system shall reserve, issue, consume, return, and reconcile spares against work orders.[cite:38][cite:42]
- The system shall track van stock, technician stock, warehouse stock, and serialized device stock.[cite:38][cite:42]
- The system shall support bundled replacement kits such as meter plus module plus seals.[cite:39][cite:42]
- The system shall interface material consumption to ERP or cost-management systems.[cite:24][cite:38]

### 14. Device replacement management

The solution shall support governed replacement processes for defective, obsolete, damaged, tampered, non-communicating, or upgrade-target devices.[cite:38][cite:39][cite:42] Replacement shall update operational, inventory, billing, and audit records consistently.[cite:20][cite:39][cite:42]

Detailed requirements:

- The system shall trigger replacement from complaint, field inspection, communication failure, preventive campaign, or recall action.[cite:38][cite:39]
- The system shall capture old-device final read, removal reason, seal condition, and return disposition.[cite:38][cite:39]
- The system shall capture new-device installation, pairing, testing, and commissioning information.[cite:38][cite:42]
- The system shall update customer-service, billing, inventory, and device-history records without loss of traceability.[cite:39][cite:42]
- The system shall trigger billing proration or correction when replacement affects bill determinants.[cite:20][cite:39]

### 15. Asset maintenance and reliability

The solution shall support preventive, corrective, and condition-based maintenance for service-affecting distribution and customer-related assets.[cite:17][cite:22] Maintenance data shall be linked to service performance and customer impact where relevant.[cite:17][cite:22]

Detailed requirements:

- The system shall maintain asset hierarchy, criticality, maintenance strategies, inspection plans, and work history.[cite:17][cite:22]
- The system shall support defect recording, recommendation generation, and follow-on work creation.[cite:17]
- The system shall support failure coding, root-cause analysis, and repeat-failure reporting.[cite:17][cite:22]
- The system shall report preventive-maintenance compliance, backlog, and service-impact metrics.[cite:17][cite:22]

### 16. Outage and event linkage

The solution shall support linkage between customer operations and outage or network events to improve triage and prevent duplicate work.[cite:22][cite:27][cite:54] This is especially important for no-supply complaints and restoration communication.[cite:22][cite:27]

Detailed requirements:

- The system shall display known outage context on customer and complaint screens.[cite:22][cite:27]
- The system shall cluster complaints around common outage events when relevant.[cite:22]
- The system shall support restoration updates and planned-outage notices through customer channels.[cite:22][cite:27]
- The system shall support analytics linking outage events with complaints and service performance.[cite:22][cite:27]

### 17. Integration architecture requirements

The solution shall integrate with enterprise and operational systems in a controlled way because a utility CIS ecosystem rarely operates alone.[cite:45][cite:54] Strong integration is necessary for customer service quality, billing accuracy, and field execution.[cite:24][cite:54]

Detailed requirements:

- The system shall integrate with ERP or finance systems for receivables, deposits, material usage, work costing, and ledger postings.[cite:24][cite:32]
- The system shall integrate with GIS for premise, service-point, and asset geolocation.[cite:17][cite:22]
- The system shall integrate with MDMS, HES, or AMI platforms for reads, intervals, commands, and events.[cite:33][cite:34][cite:39]
- The system shall integrate with payment channels for confirmation, reversal, and reconciliation.[cite:23][cite:27]
- The system shall integrate with CRM, portal, app, chatbot, and notification channels.[cite:25][cite:27]
- The system shall integrate with outage or network-event platforms where relevant.[cite:22][cite:27]
- The system shall integrate with identity and access-management services for secure authentication.[cite:19]

### 18. Reporting, controls, and non-functional requirements

The solution shall support both operational management and compliance governance through structured reporting, access control, audit, and scale.[cite:19][cite:47][cite:57] Requirements shall also be traceable into testing and implementation governance.[cite:48][cite:56]

Detailed requirements:

- The system shall provide operational dashboards for billing, collections, complaints, device health, and field performance.[cite:17][cite:20][cite:39]
- The system shall provide audit-ready records for configuration changes, sensitive transactions, and closure evidence.[cite:19][cite:23][cite:25]
- The system shall support role-based access control and maker-checker approval for high-risk actions.[cite:19][cite:23]
- The system shall support high-volume bill runs, payment surges, and outage-driven case spikes.[cite:22][cite:54]
- The system shall support modular deployment across suite products provided business-process integrity is preserved.[cite:32][cite:34][cite:54]

## High-priority scenario list

The selected solution shall be able to demonstrate these end-to-end scenarios during evaluation and acceptance.[cite:45][cite:47][cite:56]

| Scenario ID | Scenario |
|---|---|
| SC-001 | New service from application through activation, first bill, and first payment. [cite:23][cite:29] |
| SC-002 | Move-out with final read, final bill, deposit offset, and closure. [cite:23][cite:46] |
| SC-003 | Move-in on same energized premise with effective-dated handover. [cite:46] |
| SC-004 | Customer-to-customer transfer on same service point without losing billing history. [cite:46] |
| SC-005 | Minimum bill triggered and transparently explained to customer-service user. [cite:20][cite:21] |
| SC-006 | Manual field read with image evidence and validation mismatch workflow. [cite:41][cite:44] |
| SC-007 | Smart meter event leads to exception handling and remote or field action. [cite:33][cite:39] |
| SC-008 | Faulty smart-meter replacement with old/new device traceability, inventory movement, and billing update. [cite:38][cite:39][cite:42] |
| SC-009 | Billing dispute complaint linked to read history, tariff logic, field evidence, and rebill. [cite:20][cite:25][cite:44] |
| SC-010 | No-supply complaint is clustered to known outage to avoid duplicate dispatch. [cite:22][cite:27] |

## Vendor evaluation use

This BRD is structured so that the requirement catalogue can become a vendor scoring sheet and a requirement traceability matrix in later phases.[cite:47][cite:48][cite:56] The next natural deliverables after this BRD are a weighted requirement matrix, process-flow pack, FRD, and RTM tied to test scenarios.[cite:48][cite:51][cite:56]
