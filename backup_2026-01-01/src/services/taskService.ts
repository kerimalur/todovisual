import { Task, TaskImpact } from '@/types';
import { differenceInDays, isSameDay, startOfDay } from 'date-fns';

export type EisenhowerQuadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';

/**
 * TaskService - Reine Datenlogik für Tasks (keine UI)
 * Trennt Business-Logik von Rendering-Logik
 */
export class TaskService {
  /**
   * Get Most Important Task (MIT)
   * Priorisiert Tasks mit Due Date heute, dann nach Priorität
   */
  static getMIT(tasks: Task[]): Task | null {
    const incomplete = tasks.filter(
      (t) => t.status !== 'completed' && t.status !== 'archived'
    );

    if (incomplete.length === 0) return null;

    const today = startOfDay(new Date());

    // Priorisiere Tasks die heute fällig sind
    const dueToday = incomplete.filter((t) => {
      if (!t.dueDate) return false;
      return isSameDay(new Date(t.dueDate), today);
    });

    if (dueToday.length > 0) {
      return this.prioritizeTasks(dueToday)[0];
    }

    // Sonst nimm die höchste Priorität mit Goal-Linkage
    return this.prioritizeTasks(incomplete)[0];
  }

  /**
   * Sortiert Tasks nach Priorität und Impact
   */
  static prioritizeTasks(tasks: Task[]): Task[] {
    const priorityWeight = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    const impactWeight: Record<TaskImpact, number> = {
      'urgent-important': 5,
      'goal-advancing': 4,
      maintenance: 2,
      'urgent-not-important': 3,
      filler: 1,
    };

    return [...tasks].sort((a, b) => {
      // Erst nach Impact
      const aImpact = a.impact ? impactWeight[a.impact] : 0;
      const bImpact = b.impact ? impactWeight[b.impact] : 0;
      if (aImpact !== bImpact) return bImpact - aImpact;

      // Dann nach Priorität
      const aPrio = priorityWeight[a.priority];
      const bPrio = priorityWeight[b.priority];
      if (aPrio !== bPrio) return bPrio - aPrio;

      // Dann nach Goal-Linkage
      if (a.goalId && !b.goalId) return -1;
      if (!a.goalId && b.goalId) return 1;

      // Dann nach Due Date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });
  }

  /**
   * Klassifiziert Task in Eisenhower-Matrix
   * Q1: Dringend + Wichtig
   * Q2: Wichtig, nicht dringend (IDEAL ZONE)
   * Q3: Dringend, nicht wichtig
   * Q4: Weder dringend noch wichtig
   */
  static classifyTask(task: Task): EisenhowerQuadrant {
    const isUrgent = this.isTaskUrgent(task);
    const isImportant = this.isTaskImportant(task);

    if (isUrgent && isImportant) return 'Q1';
    if (!isUrgent && isImportant) return 'Q2'; // FOCUS HIER!
    if (isUrgent && !isImportant) return 'Q3';
    return 'Q4';
  }

  /**
   * Prüft ob Task dringend ist (Due Date ≤ 2 Tage oder urgent priority)
   */
  static isTaskUrgent(task: Task): boolean {
    if (task.priority === 'urgent') return true;

    if (task.dueDate) {
      const daysUntilDue = differenceInDays(new Date(task.dueDate), new Date());
      return daysUntilDue <= 2;
    }

    return false;
  }

  /**
   * Prüft ob Task wichtig ist (Goal-linked oder goal-advancing impact)
   */
  static isTaskImportant(task: Task): boolean {
    // Hat Goal-Linkage?
    if (task.goalId) return true;

    // Hat wichtigen Impact?
    if (
      task.impact === 'goal-advancing' ||
      task.impact === 'urgent-important'
    ) {
      return true;
    }

    // High Priority ohne Due Date könnte wichtig sein
    if (task.priority === 'high' && !task.dueDate) return true;

    return false;
  }

  /**
   * Filter Tasks nach Eisenhower Quadrant
   */
  static filterByQuadrant(
    tasks: Task[],
    quadrant: EisenhowerQuadrant
  ): Task[] {
    return tasks.filter((t) => this.classifyTask(t) === quadrant);
  }

  /**
   * Berechne Eisenhower-Verteilung (für Analytics)
   */
  static getQuadrantDistribution(tasks: Task[]): Record<EisenhowerQuadrant, number> {
    const activeTasks = tasks.filter((t) => t.status !== 'completed');
    const total = activeTasks.length;

    if (total === 0) {
      return { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    }

    const distribution = {
      Q1: this.filterByQuadrant(activeTasks, 'Q1').length,
      Q2: this.filterByQuadrant(activeTasks, 'Q2').length,
      Q3: this.filterByQuadrant(activeTasks, 'Q3').length,
      Q4: this.filterByQuadrant(activeTasks, 'Q4').length,
    };

    // Konvertiere zu Prozent
    return {
      Q1: Math.round((distribution.Q1 / total) * 100),
      Q2: Math.round((distribution.Q2 / total) * 100),
      Q3: Math.round((distribution.Q3 / total) * 100),
      Q4: Math.round((distribution.Q4 / total) * 100),
    };
  }

  /**
   * Filter Tasks nach Status
   */
  static filterByStatus(
    tasks: Task[],
    status: Task['status']
  ): Task[] {
    return tasks.filter((t) => t.status === status);
  }

  /**
   * Filter Tasks nach Goal
   */
  static filterByGoal(tasks: Task[], goalId: string): Task[] {
    return tasks.filter((t) => t.goalId === goalId);
  }

  /**
   * Filter Tasks nach Project
   */
  static filterByProject(tasks: Task[], projectId: string): Task[] {
    return tasks.filter((t) => t.projectId === projectId);
  }

  /**
   * Berechne Completion Rate
   */
  static getCompletionRate(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  }

  /**
   * Get Tasks fällig in den nächsten N Tagen
   */
  static getUpcomingTasks(tasks: Task[], days: number = 7): Task[] {
    const now = new Date();
    const futureCutoff = new Date();
    futureCutoff.setDate(futureCutoff.getDate() + days);

    return tasks
      .filter((t) => {
        if (t.status === 'completed' || !t.dueDate) return false;
        const due = new Date(t.dueDate);
        return due >= now && due <= futureCutoff;
      })
      .sort((a, b) => {
        const aDate = new Date(a.dueDate!).getTime();
        const bDate = new Date(b.dueDate!).getTime();
        return aDate - bDate;
      });
  }

  /**
   * Get überfällige Tasks
   */
  static getOverdueTasks(tasks: Task[]): Task[] {
    const now = new Date();
    return tasks
      .filter((t) => {
        if (t.status === 'completed' || !t.dueDate) return false;
        return new Date(t.dueDate) < now;
      })
      .sort((a, b) => {
        const aDate = new Date(a.dueDate!).getTime();
        const bDate = new Date(b.dueDate!).getTime();
        return aDate - bDate; // Älteste zuerst
      });
  }

  /**
   * Prüft ob Task archiviert werden sollte
   * (Completed älter als N Tage)
   */
  static shouldArchive(task: Task, daysOld: number = 30): boolean {
    if (task.status !== 'completed' || !task.completedAt) return false;

    const daysSinceCompletion = differenceInDays(
      new Date(),
      new Date(task.completedAt)
    );

    return daysSinceCompletion >= daysOld;
  }
}
