<script lang="ts">
  import {
    FlowStepHeader,
    FlowStepScaffold,
    StepActionBar,
    StepActionButtons,
    StepAlert,
    StepReviewRow,
    StepSection,
  } from '@garden-ui/flow-step';

  let changed = $state(false);
  let primaryClicked = $state(false);
  let secondaryClicked = $state(false);
</script>

<FlowStepScaffold
  step={2}
  total={3}
  title="Package scaffold"
  subtitle="Custom styling hook proof"
  labels={['One', 'Two', 'Three']}
  className="fixture-scaffold"
  headerProps={{
    className: 'fixture-header',
    activeSegmentClassName: 'fixture-segment-active',
    inactiveSegmentClassName: 'fixture-segment-inactive',
    activeLabelClassName: 'fixture-label-active',
    inactiveLabelClassName: 'fixture-label-inactive',
  }}
  data-fixture-scaffold
>
  <FlowStepHeader
    step={1}
    total={2}
    title="Standalone header"
    labels={['Start', 'Done']}
    className="fixture-standalone-header"
    activeSegmentClassName="fixture-standalone-active"
  />

  <StepAlert
    variant="warning"
    title="Needs attention"
    message="Review before continuing."
    unstyled
    className="fixture-alert"
    contentClassName="fixture-alert-content"
    titleClassName="fixture-alert-title"
  />

  <StepReviewRow
    label="Recipient"
    value="Alice"
    onChange={() => (changed = true)}
    unstyled
    className="fixture-review-row"
    labelClassName="fixture-review-label"
    valueClassName="fixture-review-value"
    buttonClassName="fixture-review-button"
  />

  <StepSection title="Section title" subtitle="Section subtitle" className="fixture-section" titleClassName="fixture-section-header">
    <div class="fixture-section-body">Section body</div>
  </StepSection>

  <StepActionBar className="fixture-action-bar" align="between" stackOnMobile={false}>
    {#snippet secondary()}
      <button class="fixture-action-secondary" onclick={() => (secondaryClicked = true)}>Back</button>
    {/snippet}
    {#snippet primary()}
      <button class="fixture-action-primary" onclick={() => (primaryClicked = true)}>Continue</button>
    {/snippet}
  </StepActionBar>

  <StepActionButtons
    className="fixture-action-buttons"
    primaryLabel="Save"
    secondaryLabel="Cancel"
    onPrimary={() => (primaryClicked = true)}
    onSecondary={() => (secondaryClicked = true)}
    primaryClass="fixture-buttons-primary"
    secondaryClass="fixture-buttons-secondary"
  />

  <div data-changed={changed ? 'yes' : 'no'}></div>
  <div data-primary={primaryClicked ? 'yes' : 'no'} data-secondary={secondaryClicked ? 'yes' : 'no'}></div>
</FlowStepScaffold>