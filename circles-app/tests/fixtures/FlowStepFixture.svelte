<script lang="ts">
  import { FlowStepHeader, FlowStepScaffold, StepAlert, StepReviewRow } from '@garden-ui/flow-step';

  let changed = $state(false);
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

  <div data-changed={changed ? 'yes' : 'no'}></div>
</FlowStepScaffold>