/**
 * Utility functions to transform between camelCase (TypeScript) and snake_case (Database)
 */

// Convert snake_case keys to camelCase
export function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }

  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  const transformed: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      transformed[camelKey] = snakeToCamel(obj[key]);
    }
  }

  return transformed;
}

// Convert camelCase keys to snake_case
export function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnake(item));
  }

  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  const transformed: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      const value = obj[key];

      // Don't include undefined values
      if (value !== undefined) {
        transformed[snakeKey] = camelToSnake(value);
      }
    }
  }

  return transformed;
}

// Specific field mappings where the naming differs more than just case
const fieldMappings: Record<string, Record<string, string>> = {
  tasks: {
    'project_id': 'projectId',
    'goal_id': 'goalId',
    'project_ids': 'projectIds',
    'goal_ids': 'goalIds',
    'estimated_minutes': 'estimatedMinutes',
    'actual_minutes': 'actualMinutes',
    'energy_level': 'energyLevel',
    'completed_at': 'completedAt',
    'archived_at': 'archivedAt',
    'parent_task_id': 'parentTaskId',
    'focus_session_ids': 'focusSessionIds',
    'recurring_frequency': 'recurringFrequency',
    'recurring_days_of_week': 'recurringDaysOfWeek',
    'recurring_interval': 'recurringInterval',
    'recurring_end_date': 'recurringEndDate',
    'recurring_next_occurrence': 'recurringNextOccurrence',
    'recurring_is_active': 'recurringIsActive',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  },
  goals: {
    'user_id': 'userId',
    'smart_criteria': 'smartCriteria',
    'weekly_plan': 'weeklyPlan',
    'workflow_mode': 'workflowMode',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  },
  projects: {
    'user_id': 'userId',
    'goal_id': 'goalId',
    'goal_ids': 'goalIds',
    'start_date': 'startDate',
    'timeline_phases': 'timelinePhases',
    'workflow_mode': 'workflowMode',
    'review_cadence': 'reviewCadence',
    'risk_level': 'riskLevel',
    'trading_strategy': 'tradingStrategy',
    'trading_risk_level': 'tradingRiskLevel',
    'trading_target_return': 'tradingTargetReturn',
    'trading_current_return': 'tradingCurrentReturn',
    'fitness_workout_days': 'fitnessWorkoutDays',
    'fitness_exercise_type': 'fitnessExerciseType',
    'fitness_target_weight': 'fitnessTargetWeight',
    'fitness_current_weight': 'fitnessCurrentWeight',
    'finance_budget': 'financeBudget',
    'finance_spent': 'financeSpent',
    'finance_savings_target': 'financeSavingsTarget',
    'finance_current_savings': 'financeCurrentSavings',
    'programming_tech_stack': 'programmingTechStack',
    'programming_repository': 'programmingRepository',
    'programming_deployment_url': 'programmingDeploymentUrl',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  },
  calendar_events: {
    'user_id': 'userId',
    'task_id': 'taskId',
    'start_time': 'startTime',
    'end_time': 'endTime',
    'all_day': 'allDay',
    'event_type': 'eventType',
    'is_time_block': 'isTimeBlock',
    'linked_task_id': 'linkedTaskId',
    'google_event_id': 'googleEventId',
    'is_from_google_calendar': 'isFromGoogleCalendar',
    'last_synced_at': 'lastSyncedAt',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  },
  journal_entries: {
    'user_id': 'userId',
    'entry_date': 'entryDate',
    'completed_tasks': 'completedTasks',
    'focus_minutes': 'focusMinutes',
    'is_weekly_reflection': 'isWeeklyReflection',
    'reflection_productivity': 'reflectionProductivity',
    'reflection_energy': 'reflectionEnergy',
    'reflection_focus': 'reflectionFocus',
    'reflection_went_well': 'reflectionWentWell',
    'reflection_could_improve': 'reflectionCouldImprove',
    'reflection_gratitude': 'reflectionGratitude',
    'reflection_tomorrow_priority': 'reflectionTomorrowPriority',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  },
  habits: {
    'user_id': 'userId',
    'goal_id': 'goalId',
    'project_id': 'projectId',
    'category_id': 'categoryId',
    'target_per_week': 'targetPerWeek',
    'specific_days': 'specificDays',
    'target_value': 'targetValue',
    'target_unit': 'targetUnit',
    'reminder_time': 'reminderTime',
    'reminder_enabled': 'reminderEnabled',
    'energy_level': 'energyLevel',
    'best_time_of_day': 'bestTimeOfDay',
    'current_streak': 'currentStreak',
    'longest_streak': 'longestStreak',
    'total_completions': 'totalCompletions',
    'is_active': 'isActive',
    'is_paused': 'isPaused',
    'paused_until': 'pausedUntil',
    'stack_before': 'stackBefore',
    'stack_after': 'stackAfter',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  },
  habit_completions: {
    'habit_id': 'habitId',
    'completion_date': 'completionDate',
    'created_at': 'createdAt',
  },
  habit_categories: {
    'user_id': 'userId',
    'created_at': 'createdAt',
  },
  tags: {
    'user_id': 'userId',
    'created_at': 'createdAt',
  },
  notes: {
    'user_id': 'userId',
    'is_pinned': 'isPinned',
    'is_favorite': 'isFavorite',
    'is_archived': 'isArchived',
    'archived_at': 'archivedAt',
    'linked_task_ids': 'linkedTaskIds',
    'linked_goal_ids': 'linkedGoalIds',
    'linked_project_ids': 'linkedProjectIds',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  },
  brainstorm_sessions: {
    'user_id': 'userId',
    'linked_goal_id': 'linkedGoalId',
    'linked_project_id': 'linkedProjectId',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  },
  brainstorm_ideas: {
    'session_id': 'sessionId',
    'position_x': 'positionX',
    'position_y': 'positionY',
    'parent_id': 'parentId',
    'created_at': 'createdAt',
  },
  time_entries: {
    'user_id': 'userId',
    'task_id': 'taskId',
    'start_time': 'startTime',
    'end_time': 'endTime',
    'duration_minutes': 'durationMinutes',
    'is_running': 'isRunning',
    'created_at': 'createdAt',
  },
  focus_sessions: {
    'user_id': 'userId',
    'task_id': 'taskId',
    'start_time': 'startTime',
    'end_time': 'endTime',
    'planned_minutes': 'plannedMinutes',
    'actual_minutes': 'actualMinutes',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  },
  daily_stats: {
    'user_id': 'userId',
    'stats_date': 'statsDate',
    'completed_tasks': 'completedTasks',
    'focus_minutes': 'focusMinutes',
    'habits_completed': 'habitsCompleted',
    'habits_total': 'habitsTotal',
    'tasks_created': 'tasksCreated',
    'productivity_score': 'productivityScore',
    'created_at': 'createdAt',
  },
};

// Transform database response to TypeScript types
export function dbToTypescript(tableName: string, data: any): any {
  if (!data) return data;

  const mappings = fieldMappings[tableName] || {};
  const transformed = snakeToCamel(data);

  // Apply custom mappings
  for (const [dbField, tsField] of Object.entries(mappings)) {
    const snakeCaseField = dbField;
    const camelCaseField = snakeToCamel(snakeCaseField) ? snakeCaseField.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) : snakeCaseField;

    if (transformed[camelCaseField] !== undefined) {
      transformed[tsField] = transformed[camelCaseField];
      delete transformed[camelCaseField];
    }
  }

  return transformed;
}

// Transform TypeScript types to database format
export function typescriptToDb(tableName: string, data: any): any {
  if (!data) return data;

  const camelCaseData = camelToSnake(data);
  const mappings = fieldMappings[tableName] || {};

  // No additional transformation needed, camelToSnake handles most cases
  return camelCaseData;
}
