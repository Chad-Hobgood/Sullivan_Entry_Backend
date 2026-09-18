/**
 * Refreshes all entry-logging metrics in one Apps Script execution.
 *
 * Create one time-driven trigger for this function instead of separate
 * triggers for the individual functions in Entry_Logging. The metric
 * functions remain in their own files for independent maintenance and
 * manual execution.
 */
function runLoggingUpdates() {
  const startedAt = new Date();
  Logger.log(`[Logging Handler] Started at ${startedAt.toISOString()}.`);

  const steps = [
    ['calculateArrivalDistribution', calculateArrivalDistribution],
    ['calculateUserFrequency', calculateUserFrequency],
    ['calculateRollingUserCounts', calculateRollingUserCounts],
    ['calculateDetailedVisitGaps', calculateDetailedVisitGaps],
    ['calculateRegularVisitGaps', calculateRegularVisitGaps],
    ['calculateDayOfWeekDistribution', calculateDayOfWeekDistribution],
    ['calculateTimeOfDayByDay', calculateTimeOfDayByDay],
    ['calculateEquipmentUsageCounts', calculateEquipmentUsageCounts],
  ];

  steps.forEach(([name, step], index) => {
    const stepStartedAt = new Date();
    Logger.log(
      `[Logging Handler] Step ${index + 1}/${steps.length} started: ${name} ` +
      `at ${stepStartedAt.toISOString()}.`,
    );

    try {
      step();
      const stepFinishedAt = new Date();
      Logger.log(
        `[Logging Handler] Step ${index + 1}/${steps.length} finished: ${name} ` +
        `at ${stepFinishedAt.toISOString()}.`,
      );
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      Logger.log(
        `[Logging Handler] Step ${index + 1}/${steps.length} failed: ${name}. ` +
        `Error: ${message}`,
      );
      console.error(`[Logging Handler] ${name} failed: ${message}`);
      throw error;
    }
  });

  const finishedAt = new Date();
  Logger.log(`[Logging Handler] Completed at ${finishedAt.toISOString()}.`);
}
