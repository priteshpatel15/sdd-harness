import path from "node:path";
import { SddError } from "../../domain/errors";
import { createCliContext } from "./context";
import { getBooleanOption, getStringArrayOption, getStringOption, parseArgs, ParsedArgs } from "./args";
import { captureQuestions, helpText, parseAgentProvider, parseBranchPurpose, parseCheckpointKind, parseGreenfieldThrough, parseJtbd, parseNonNegativeInteger, parseOrchestratorOwner, parseOrchestratorProfile, parseOrchestratorRepairOwner, parseOrchestratorTarget, parsePromptId, parseReviewDecisions, parseReviewLenses, parseStepId, parseTddEvidencePhase, readQuestionEvidence, requireOption } from "./cli-helpers";

export interface CliIo {
  readonly cwd: string;
  readonly stdout: (message: string) => void;
  readonly stderr: (message: string) => void;
}

export async function runCli(argv: readonly string[], io: CliIo): Promise<number> {
  const parsed = parseArgs(argv);
  const project = getStringOption(parsed.options, "project");
  const context = createCliContext(io.cwd, project);
  const command = commandPath(parsed);

  try {
    switch (command) {
      case "help":
      case "--help":
      case "-h":
        io.stdout(helpText());
        return 0;
      case "stakeholder setup": {
        const result = await context.useCases.setupStakeholders.execute({
          product: getStringOption(parsed.options, "product"),
          thoughts: getStringArrayOption(parsed.options, "thought")
        });
        io.stdout(`Updated stakeholder thoughts: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "jtbd intake": {
        const jtbd = parseJtbd(parsed.options);
        await context.useCases.intakeJtbd.execute(jtbd);
        io.stdout(`Created JTBD intake for ${jtbd.productName}.`);
        return 0;
      }
      case "constitution create": {
        await context.useCases.createConstitution.execute(await readQuestionEvidence(context, parsed.options, "constitution"));
        io.stdout("Created constitution: specs/mission.md, specs/tech-stack.md, specs/roadmap.md.");
        return 0;
      }
      case "constitution validate": {
        await context.useCases.validateSpec.execute({});
        io.stdout("Validated constitution.");
        return 0;
      }
      case "constitution approve": {
        const result = await context.useCases.approveSpec.execute({
          target: "constitution",
          reviewer: requireOption(parsed.options, "reviewer"),
          notes: getStringOption(parsed.options, "notes")
        });
        io.stdout(`Approved constitution: ${path.relative(context.projectRoot, result.approvalPath)}.`);
        return 0;
      }
      case "brownfield discover": {
        const profile = await context.useCases.discoverBrownfield.execute();
        io.stdout(JSON.stringify(profile, null, 2));
        return 0;
      }
      case "questions capture": {
        const result = await captureQuestions(context, parsed.options);
        io.stdout(`Captured grouped question evidence: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "feature create": {
        const result = await context.useCases.createFeatureSpec.execute({
          name: getStringOption(parsed.options, "name"),
          questionEvidence: await readQuestionEvidence(context, parsed.options, "feature-spec"),
          waiverReason: getStringOption(parsed.options, "waiver-reason"),
          approvedBy: getStringOption(parsed.options, "approved-by")
        });
        io.stdout(`Created feature spec: ${result.featureId}.`);
        return 0;
      }
      case "feature revise": {
        const result = await context.useCases.reviseFeatureSpec.execute({
          featureId: requireOption(parsed.options, "feature"),
          request: requireOption(parsed.options, "request")
        });
        io.stdout(`Created revision packet: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "feature semantics": {
        const featureId = requireOption(parsed.options, "feature");
        const result = await context.useCases.createSemanticContract.execute({
          featureId,
          questionEvidence: await readQuestionEvidence(context, parsed.options, "semantic-contract")
        });
        io.stdout(`Created semantic contract: ${result.featureId} (${result.path}).`);
        return 0;
      }
      case "feature validate-spec": {
        const featureId = requireOption(parsed.options, "feature");
        await context.useCases.validateSpec.execute({ featureId });
        io.stdout(`Validated feature spec: ${featureId}.`);
        return 0;
      }
      case "feature approve": {
        const featureId = requireOption(parsed.options, "feature");
        const result = await context.useCases.approveSpec.execute({
          target: "feature",
          featureId,
          reviewer: requireOption(parsed.options, "reviewer"),
          notes: getStringOption(parsed.options, "notes")
        });
        io.stdout(`Approved feature spec: ${featureId} (${path.relative(context.projectRoot, result.approvalPath)}).`);
        return 0;
      }
      case "feature plan-tdd": {
        const featureId = requireOption(parsed.options, "feature");
        const result = await context.useCases.planTdd.execute(featureId);
        io.stdout(`Created TDD plan: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "feature implement": {
        const result = await context.useCases.implementTaskGroup.execute({
          featureId: requireOption(parsed.options, "feature"),
          taskGroup: getStringOption(parsed.options, "task-group"),
          agentCommand: getStringOption(parsed.options, "agent-command"),
          execute: getBooleanOption(parsed.options, "execute")
        });
        io.stdout(result.packetPath !== undefined ? `Created implementation packet: ${path.relative(context.projectRoot, result.packetPath)}.` : `Implementation command exited ${result.exitCode}.`);
        return result.exitCode ?? 0;
      }
      case "feature record-tdd": {
        const result = await context.useCases.recordTddEvidence.execute({
          featureId: requireOption(parsed.options, "feature"),
          taskGroup: requireOption(parsed.options, "task-group"),
          phase: parseTddEvidencePhase(requireOption(parsed.options, "phase")),
          evidence: getStringArrayOption(parsed.options, "evidence"),
          command: requireOption(parsed.options, "command")
        });
        io.stdout(`Recorded TDD ${result.result}: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "feature complete-task-group": {
        const result = await context.useCases.completeTaskGroup.execute({
          featureId: requireOption(parsed.options, "feature"),
          taskGroup: requireOption(parsed.options, "task-group"),
          implementationEvidence: getStringArrayOption(parsed.options, "implementation-evidence"),
          testEvidence: getStringArrayOption(parsed.options, "test-evidence"),
          tddRedEvidence: getStringArrayOption(parsed.options, "tdd-red-evidence"),
          tddGreenEvidence: getStringArrayOption(parsed.options, "tdd-green-evidence"),
          tddRefactorEvidence: getStringArrayOption(parsed.options, "tdd-refactor-evidence"),
          strictTdd: getBooleanOption(parsed.options, "strict-tdd"),
          compatTdd: getBooleanOption(parsed.options, "compat-tdd"),
          waiverReason: getStringOption(parsed.options, "waiver-reason"),
          approvedBy: getStringOption(parsed.options, "approved-by")
        });
        io.stdout(`Recorded task group completion: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "feature run-validation": {
        const commands = getStringArrayOption(parsed.options, "command");
        const result = await context.useCases.runValidation.execute({
          featureId: getStringOption(parsed.options, "feature"),
          commands: commands.length > 0 ? commands : undefined,
          testDatabase: getStringOption(parsed.options, "test-database"),
          testDatabaseEnv: getStringOption(parsed.options, "test-database-env"),
          strictPlaywright: getBooleanOption(parsed.options, "strict-playwright"),
          compatPlaywright: getBooleanOption(parsed.options, "compat-playwright")
        });
        io.stdout(`Validation passed with ${result.evidence.length} command evidence item(s).`);
        return 0;
      }
      case "feature deep-review": {
        const result = await context.useCases.deepReview.execute({
          featureId: getStringOption(parsed.options, "feature"),
          waiverReason: getStringOption(parsed.options, "waiver-reason"),
          approvedBy: getStringOption(parsed.options, "approved-by")
        });
        io.stdout(`Created deep review packet: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "feature semantic-verify": {
        const result = await context.useCases.semanticVerify.execute({
          featureId: requireOption(parsed.options, "feature"),
          waiverReason: getStringOption(parsed.options, "waiver-reason"),
          approvedBy: getStringOption(parsed.options, "approved-by")
        });
        io.stdout(`Semantic verification ${result.status}: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "feature review-decisions": {
        const result = await context.useCases.reviewDecisions.execute({
          featureId: getStringOption(parsed.options, "feature"),
          decisions: parseReviewDecisions(getStringArrayOption(parsed.options, "decision"))
        });
        io.stdout(`Recorded review decisions: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "feature complete": {
        await context.useCases.completeFeature.execute({
          featureId: requireOption(parsed.options, "feature"),
          roadmapEvidence: getStringOption(parsed.options, "roadmap-evidence"),
          waiverReason: getStringOption(parsed.options, "waiver-reason"),
          approvedBy: getStringOption(parsed.options, "approved-by")
        });
        io.stdout("Feature is ready to merge.");
        return 0;
      }
      case "replan create": {
        const result = await context.useCases.replan.execute({
          changeName: requireOption(parsed.options, "name"),
          reason: requireOption(parsed.options, "reason"),
          impact: requireOption(parsed.options, "impact"),
          updateStrategy: getStringOption(parsed.options, "strategy")
        });
        io.stdout(`Created replan artifact: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "replan impact": {
        const result = await context.useCases.replan.impact({
          changeName: requireOption(parsed.options, "name"),
          notes: requireOption(parsed.options, "notes")
        });
        io.stdout(`Marked ${result.impactedFeatures.length} feature spec(s) as needing review.`);
        return 0;
      }
      case "changelog update": {
        const result = await context.useCases.updateChangelog.execute();
        io.stdout(result.changed ? `Updated ${path.relative(context.projectRoot, result.path)}.` : "Changelog already up to date.");
        return 0;
      }
      case "mvp plan": {
        const result = await context.useCases.createFeatureSpec.execute({
          name: getStringOption(parsed.options, "name") ?? "MVP",
          questionEvidence: await readQuestionEvidence(context, parsed.options, "mvp"),
          mvp: true,
          waiverReason: getStringOption(parsed.options, "waiver-reason"),
          approvedBy: getStringOption(parsed.options, "approved-by")
        });
        io.stdout(`Created MVP spec: ${result.featureId}.`);
        return 0;
      }
      case "mvp retro": {
        const result = await context.useCases.mvpRetro.execute({
          featureId: requireOption(parsed.options, "feature"),
          findings: requireOption(parsed.options, "findings"),
          specClarificationsNeeded: getBooleanOption(parsed.options, "spec-clarifications-needed")
        });
        io.stdout(`Recorded MVP retro: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "workflow status": {
        const status = await context.useCases.workflowStatus.execute();
        io.stdout([...status.lines, status.nextCommand !== undefined ? `Next: ${status.nextCommand}` : "Next: workflow complete"].join("\n"));
        return 0;
      }
      case "workflow next": {
        const next = await context.useCases.workflowNext.execute();
        io.stdout(next.command !== undefined ? `${next.step}\n${next.command}` : "Workflow complete.");
        return 0;
      }
      case "workflow doctor": {
        const result = await context.useCases.workflowDoctor.execute({
          strict: getBooleanOption(parsed.options, "strict")
        });
        io.stdout(result.lines.join("\n"));
        return result.healthy ? 0 : 2;
      }
      case "workflow checkpoint": {
        const result = await context.useCases.workflowCheckpoint.execute({
          stepId: parseStepId(requireOption(parsed.options, "step")),
          kind: parseCheckpointKind(getStringOption(parsed.options, "kind") ?? "manual"),
          notes: requireOption(parsed.options, "notes"),
          featureId: getStringOption(parsed.options, "feature")
        });
        io.stdout(`Recorded checkpoint: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "workflow branch": {
        const result = await context.useCases.workflowBranch.execute({
          purpose: parseBranchPurpose(requireOption(parsed.options, "purpose")),
          name: requireOption(parsed.options, "name"),
          featureId: getStringOption(parsed.options, "feature"),
          allowDirty: getBooleanOption(parsed.options, "allow-dirty")
        });
        io.stdout(`Created branch: ${result.branch}.`);
        return 0;
      }
      case "workflow greenfield": {
        const result = await context.useCases.workflowGreenfield.execute({
          agent: getStringOption(parsed.options, "agent") === undefined ? undefined : parseAgentProvider(requireOption(parsed.options, "agent")),
          through: parseGreenfieldThrough(getStringOption(parsed.options, "through") ?? "feature"),
          draftOnly: getBooleanOption(parsed.options, "draft-only"),
          reviewer: getStringOption(parsed.options, "reviewer"),
          product: getStringOption(parsed.options, "product"),
          description: getStringOption(parsed.options, "description"),
          audience: getStringOption(parsed.options, "audience"),
          problem: getStringOption(parsed.options, "problem"),
          job: getStringOption(parsed.options, "job"),
          situation: getStringOption(parsed.options, "situation"),
          motivation: getStringOption(parsed.options, "motivation"),
          outcome: getStringOption(parsed.options, "outcome"),
          thoughts: getStringArrayOption(parsed.options, "thought"),
          featureName: getStringOption(parsed.options, "feature-name")
        });
        io.stdout(`Guided greenfield completed through ${result.completedThrough}${result.featureId ? ` (${result.featureId})` : ""}.`);
        return 0;
      }
      case "orchestrator init": {
        const result = await context.useCases.orchestrator.init({
          agentProvider: parseAgentProvider(requireOption(parsed.options, "agent")),
          profile: parseOrchestratorProfile(getStringOption(parsed.options, "profile") ?? "human-intent-ai-build"),
          approvedBy: getStringOption(parsed.options, "approved-by"),
          force: getBooleanOption(parsed.options, "force")
        });
        io.stdout(`Initialized orchestrator: ${path.relative(context.projectRoot, result.configPath)}.`);
        return 0;
      }
      case "orchestrator configure": {
        const owner = getStringOption(parsed.options, "owner");
        const repair = getStringOption(parsed.options, "repair");
        const maxRepairAttempts = getStringOption(parsed.options, "max-repair-attempts");
        const result = await context.useCases.orchestrator.configure({
          stepId: parseStepId(requireOption(parsed.options, "step")),
          policy: {
            owner: owner === undefined ? undefined : parseOrchestratorOwner(owner),
            repair: repair === undefined ? undefined : parseOrchestratorRepairOwner(repair),
            maxRepairAttempts: maxRepairAttempts === undefined ? undefined : parseNonNegativeInteger(maxRepairAttempts, "max-repair-attempts"),
            validationCommands: getStringArrayOption(parsed.options, "validation-command").length > 0 ? getStringArrayOption(parsed.options, "validation-command") : undefined,
            tddCommand: getStringOption(parsed.options, "tdd-command"),
            testDatabase: getStringOption(parsed.options, "test-database"),
            testDatabaseEnv: getStringOption(parsed.options, "test-database-env"),
            waiverReason: getStringOption(parsed.options, "waiver-reason"),
            approvedBy: getStringOption(parsed.options, "approved-by"),
            refactorEnabled: hasOption(parsed.options, "refactor-enabled") ? getBooleanOption(parsed.options, "refactor-enabled") : undefined,
            completeNoopGuidedSteps: hasOption(parsed.options, "complete-noop-guided-steps") ? getBooleanOption(parsed.options, "complete-noop-guided-steps") : undefined,
            autoRecordEmptyReviewDecisions: hasOption(parsed.options, "auto-record-empty-review-decisions") ? getBooleanOption(parsed.options, "auto-record-empty-review-decisions") : undefined
          }
        });
        io.stdout(`Configured orchestrator step ${result.stepId}: ${result.policy.owner}/${result.policy.repair} (${path.relative(context.projectRoot, result.configPath)}).`);
        return 0;
      }
      case "orchestrator run": {
        const result = await context.useCases.orchestrator.run({
          target: getStringOption(parsed.options, "target") === undefined ? undefined : parseOrchestratorTarget(requireOption(parsed.options, "target")),
          featureId: getStringOption(parsed.options, "feature")
        });
        io.stdout(`Orchestrator ${result.status}: ${result.message}`);
        return result.status === "blocked" || result.status === "failed" ? 2 : 0;
      }
      case "orchestrator status": {
        const result = await context.useCases.orchestrator.status();
        io.stdout(result.lines.join("\n"));
        return 0;
      }
      case "orchestrator resume": {
        const result = await context.useCases.orchestrator.resume();
        io.stdout(`Orchestrator ${result.status}: ${result.message}`);
        return result.status === "blocked" || result.status === "failed" ? 2 : 0;
      }
      case "agent configure": {
        const result = await context.useCases.agentConfigure.execute({
          provider: parseAgentProvider(requireOption(parsed.options, "provider")),
          draftCommandTemplate: getStringOption(parsed.options, "draft-command"),
          reviewCommandTemplate: getStringOption(parsed.options, "review-command"),
          implementationCommandTemplate: getStringOption(parsed.options, "implementation-command"),
          requiredReviewLenses: parseReviewLenses(getStringArrayOption(parsed.options, "required-lens"))
        });
        io.stdout(`Configured agent provider: ${result.provider}.`);
        return 0;
      }
      case "agent doctor": {
        const result = await context.useCases.agentDoctor.execute({
          provider: parseAgentProvider(requireOption(parsed.options, "provider"))
        });
        io.stdout(result.message);
        return result.available ? 0 : 2;
      }
      case "skill validate": {
        const result = await context.useCases.skillValidate.execute();
        io.stdout(`Validated ${result.checked} skill wrapper(s).`);
        return 0;
      }
      case "skill scaffold": {
        const result = await context.useCases.skillScaffold.execute({
          name: requireOption(parsed.options, "name"),
          command: requireOption(parsed.options, "command"),
          description: getStringOption(parsed.options, "description")
        });
        io.stdout(`Created skill wrapper: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "prompt list": {
        io.stdout(context.useCases.prompts.list().map((prompt) => prompt.id).join("\n"));
        return 0;
      }
      case "prompt show": {
        const prompt = context.useCases.prompts.show(parsePromptId(requireOption(parsed.options, "id")));
        io.stdout(JSON.stringify(prompt, null, 2));
        return 0;
      }
      case "prompt render": {
        const result = await context.useCases.prompts.render({
          id: parsePromptId(requireOption(parsed.options, "id")),
          featureId: getStringOption(parsed.options, "feature"),
          lens: getStringOption(parsed.options, "lens")
        });
        io.stdout(`Rendered prompt: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      case "export openspec": {
        const result = await context.exporters.openSpec.exportFeature(requireOption(parsed.options, "feature"));
        io.stdout(`Exported OpenSpec change: ${path.relative(context.projectRoot, result.changePath)}.`);
        return 0;
      }
      case "export speckit": {
        const featureId = getStringOption(parsed.options, "feature");
        if (featureId !== undefined) {
          const result = await context.exporters.specKit.exportFeature(featureId);
          io.stdout(`Exported Spec Kit feature: ${path.relative(context.projectRoot, result.featurePath)}.`);
        } else {
          const result = await context.exporters.specKit.exportConstitution();
          io.stdout(`Exported Spec Kit constitution: ${path.relative(context.projectRoot, result.path)}.`);
        }
        return 0;
      }
      case "research backlog": {
        const result = await context.useCases.researchBacklog.execute({
          question: requireOption(parsed.options, "question"),
          context: getStringOption(parsed.options, "context"),
          priority: getStringOption(parsed.options, "priority")
        });
        io.stdout(`Created research backlog item: ${path.relative(context.projectRoot, result.path)}.`);
        return 0;
      }
      default:
        io.stderr(`Unknown command: ${command}\n\n${helpText()}`);
        return 1;
    }
  } catch (error) {
    if (error instanceof SddError) {
      io.stderr(error.message);
      return error.exitCode;
    }
    io.stderr(error instanceof Error ? error.stack ?? error.message : String(error));
    return 1;
  }
}

function commandPath(parsed: ParsedArgs): string {
  return [parsed.command, parsed.positional[0]].filter(Boolean).join(" ");
}

function hasOption(options: Record<string, string | boolean | string[]>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(options, key);
}
