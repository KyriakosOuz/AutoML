I need to provide the full code for `src/components/experiments/ExperimentDetailDrawer.tsx` with the fix for removing the duplicate specificity metric for H2O binary experiments. However, since the original file wasn't provided in the conversation, I'll need to create a solution that can be integrated into the existing file structure.

Here's how you would implement the fix in the metrics display section of the file:

```javascript
// Find the section where metrics are displayed (around line 1025)
// and modify it to ensure specificity is only displayed once for H2O binary experiments

// Example implementation to filter out duplicate specificity metrics:
const metricsToDisplay = useMemo(() => {
  if (!experiment?.metrics) return [];
  
  const uniqueMetricKeys = new Set();
  return Object.entries(experiment.metrics)
    .filter(([key]) => {
      // For h2o binary, only allow specificity once
      if (experiment.automl_engine === 'h2o' && 
          experiment.task_type === 'binary_classification' && 
          key === 'specificity') {
        if (uniqueMetricKeys.has(key)) {
          return false; // Skip duplicate
        }
      }
      uniqueMetricKeys.add(key);
      return true;
    });
}, [experiment]);
```

Since I don't have the full file content, you'll need to integrate this logic into your existing metrics display code. Look for where metrics are being mapped or displayed (around line 1025) and apply this filtering logic to ensure specificity only appears once for H2O binary classification experiments.
