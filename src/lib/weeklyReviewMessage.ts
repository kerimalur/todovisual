import { addWeeks, endOfWeek, format, startOfWeek } from 'date-fns';
import { Goal, Task, WeeklyPlanItem } from '@/types';

interface BuildWeeklyReviewInput {
  tasks: Task[];
  goals: Goal[];
  now?: Date;
  weekStartsOnMonday?: boolean;
}

const MAX_MESSAGE_LENGTH = 1300;
const FALLBACK_GOAL_LINE = '- Keine Zielaufgaben mit Verknuepfung gefunden.';
const FALLBACK_NEXT_WEEK_LINE = '- Keine faelligen Zielaufgaben fuer naechste Woche.';
const WEEKDAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const toDate = (value?: Date | string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const inRange = (value: Date | null, start: Date, end: Date): boolean => {
  if (!value) return false;
  return value >= start && value <= end;
};

const getGoalLinksFromTask = (task: Task): string[] => {
  const links = new Set<string>();
  if (Array.isArray(task.goalIds)) {
    task.goalIds.forEach((goalId) => {
      if (goalId) links.add(goalId);
    });
  }
  if (task.goalId) {
    links.add(task.goalId);
  }
  return [...links];
};

const isTaskOpen = (task: Task) => task.status !== 'completed' && task.status !== 'archived';

const truncate = (value: string, maxLength = 50): string => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
};

const normalizeWeeklyPlan = (goal: Goal): WeeklyPlanItem[] => {
  if (!Array.isArray(goal.weeklyPlan)) return [];
  return goal.weeklyPlan.filter(
    (item): item is WeeklyPlanItem =>
      !!item &&
      typeof item.title === 'string' &&
      typeof item.weekday === 'number' &&
      item.weekday >= 0 &&
      item.weekday <= 6
  );
};

export const buildWeeklyReviewMessage = ({
  tasks,
  goals,
  now = new Date(),
  weekStartsOnMonday = true,
}: BuildWeeklyReviewInput): string => {
  const weekStartsOn = weekStartsOnMonday ? 1 : 0;
  const thisWeekStart = startOfWeek(now, { weekStartsOn });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn });
  const nextWeekStart = addWeeks(thisWeekStart, 1);
  const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn });

  const completedThisWeek = tasks.filter((task) =>
    task.status === 'completed' ? inRange(toDate(task.completedAt), thisWeekStart, thisWeekEnd) : false
  );

  const createdThisWeek = tasks.filter((task) =>
    inRange(toDate(task.createdAt), thisWeekStart, thisWeekEnd)
  );

  const openTasks = tasks.filter(isTaskOpen);
  const overdueTasks = openTasks.filter((task) => {
    const dueDate = toDate(task.dueDate);
    return !!dueDate && dueDate < now;
  });

  const goalStats = goals
    .map((goal) => {
      const goalTasks = tasks.filter((task) => getGoalLinksFromTask(task).includes(goal.id));
      const completedCount = goalTasks.filter((task) => task.status === 'completed').length;
      const openCount = goalTasks.filter(isTaskOpen).length;
      const dueNextWeekCount = goalTasks.filter((task) => {
        if (!isTaskOpen(task)) return false;
        return inRange(toDate(task.dueDate), nextWeekStart, nextWeekEnd);
      }).length;

      return {
        id: goal.id,
        title: goal.title,
        progress: goal.progress || 0,
        completedCount,
        openCount,
        dueNextWeekCount,
        hasLinkedTasks: goalTasks.length > 0,
      };
    })
    .filter((goal) => goal.hasLinkedTasks || goal.progress > 0)
    .sort((a, b) => {
      const scoreA = a.dueNextWeekCount * 3 + a.openCount * 2 + a.progress;
      const scoreB = b.dueNextWeekCount * 3 + b.openCount * 2 + b.progress;
      return scoreB - scoreA;
    })
    .slice(0, 3);

  const goalLines =
    goalStats.length > 0
      ? goalStats.map(
          (goal) =>
            `- ${truncate(goal.title, 34)}: ${goal.progress}% | erledigt ${goal.completedCount} | offen ${goal.openCount}`
        )
      : [FALLBACK_GOAL_LINE];

  const goalTitleById = new Map(goals.map((goal) => [goal.id, goal.title]));
  const nextWeekDueGoalTasks = openTasks
    .filter((task) => getGoalLinksFromTask(task).length > 0)
    .filter((task) => inRange(toDate(task.dueDate), nextWeekStart, nextWeekEnd))
    .sort((a, b) => {
      const dueA = toDate(a.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
      const dueB = toDate(b.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
      return dueA - dueB;
    })
    .slice(0, 4)
    .map((task) => {
      const firstGoal = getGoalLinksFromTask(task)[0];
      const goalLabel = firstGoal ? goalTitleById.get(firstGoal) : undefined;
      const dueLabel = toDate(task.dueDate) ? format(toDate(task.dueDate) as Date, 'dd.MM') : 'offen';
      return `- ${truncate(task.title, 40)} (${goalLabel ? truncate(goalLabel, 18) : 'ohne Ziel'}, ${dueLabel})`;
    });

  const nextWeekPlanLines = goals
    .flatMap((goal) =>
      normalizeWeeklyPlan(goal).map((planItem) => ({
        goalTitle: goal.title,
        title: planItem.title,
        weekday: planItem.weekday,
      }))
    )
    .sort((a, b) => a.weekday - b.weekday)
    .slice(0, 4)
    .map(
      (planItem) =>
        `- ${WEEKDAY_LABELS[planItem.weekday]}: ${truncate(planItem.title, 32)} [${truncate(
          planItem.goalTitle,
          18
        )}]`
    );

  const nextWeekLines =
    nextWeekDueGoalTasks.length > 0
      ? nextWeekDueGoalTasks
      : [FALLBACK_NEXT_WEEK_LINE];

  const planLines = nextWeekPlanLines.length > 0 ? nextWeekPlanLines : ['- Kein Weekly Plan in Zielen gepflegt.'];

  const lines = [
    `Wochenrueckblick (${format(thisWeekStart, 'dd.MM')} - ${format(thisWeekEnd, 'dd.MM')})`,
    `Erledigt: ${completedThisWeek.length} | Neu: ${createdThisWeek.length} | Offen: ${openTasks.length} | Ueberfaellig: ${overdueTasks.length}`,
    '',
    'Zielstatus:',
    ...goalLines,
    '',
    `Naechste Woche (${format(nextWeekStart, 'dd.MM')} - ${format(nextWeekEnd, 'dd.MM')}):`,
    ...nextWeekLines,
    '',
    'Geplanter Fokus aus Zielen:',
    ...planLines,
    '',
    'Empfehlung: Sonntag kurz priorisieren, Montag 1 MIT + 2 Next Actions starten.',
  ];

  const message = lines.join('\n').trim();
  return message.length > MAX_MESSAGE_LENGTH
    ? `${message.slice(0, MAX_MESSAGE_LENGTH - 3).trimEnd()}...`
    : message;
};
