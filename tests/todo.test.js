import { test, expect, describe, beforeEach } from 'vitest';
import {
  resetTasks,
  getAllTasks,
  addTask,
  completeTask,
  isDuplicate,
  isToday,
  filterDueToday,
  filterHighPriority,
  formatTask
} from '../src/todo/core.js';

describe('To-Do CLI Core', () => {
  beforeEach(() => {
    resetTasks();
  });

  describe('addTask', () => {
    test('should add a task with text only', () => {
      const task = addTask('Buy milk');
      expect(task).toMatchObject({
        text: 'Buy milk',
        priority: 'normal',
        completed: false,
        dueDate: null
      });
      expect(task.id).toBeDefined();
    });

    test('should add a task with high priority', () => {
      const task = addTask('Important task', { priority: 'high' });
      expect(task.priority).toBe('high');
    });

    test('should add a task with due date', () => {
      const dueDate = new Date('2025-12-31');
      const task = addTask('Finish project', { dueDate });
      expect(task.dueDate).toEqual(dueDate);
    });

    test('should throw error for empty text', () => {
      expect(() => addTask('')).toThrow('Task text is required');
      expect(() => addTask('   ')).toThrow('Task text is required');
    });

    test('should throw error for null/undefined text', () => {
      expect(() => addTask(null)).toThrow('Task text is required');
      expect(() => addTask(undefined)).toThrow('Task text is required');
    });

    test('should throw error for invalid priority', () => {
      expect(() => addTask('Task', { priority: 'urgent' })).toThrow('Priority must be "high" or "normal"');
    });

    test('should throw error for invalid due date', () => {
      expect(() => addTask('Task', { dueDate: 'tomorrow' })).toThrow('Due date must be a Date object');
    });

    test('should throw error for duplicate task', () => {
      addTask('Buy milk');
      expect(() => addTask('Buy milk')).toThrow('Duplicate task');
    });

    test('should throw error for duplicate with same due date', () => {
      const date = new Date('2025-12-31');
      addTask('Task', { dueDate: date });
      expect(() => addTask('Task', { dueDate: date })).toThrow('Duplicate task');
    });

    test('should allow same text with different due dates', () => {
      addTask('Task', { dueDate: new Date('2025-12-31') });
      expect(() => addTask('Task', { dueDate: new Date('2026-01-01') })).not.toThrow();
    });

    test('should trim whitespace from text', () => {
      const task = addTask('  Buy milk  ');
      expect(task.text).toBe('Buy milk');
    });
  });

  describe('getAllTasks', () => {
    test('should return empty array initially', () => {
      expect(getAllTasks()).toEqual([]);
    });

    test('should return all added tasks', () => {
      addTask('Task 1');
      addTask('Task 2');
      const tasks = getAllTasks();
      expect(tasks).toHaveLength(2);
    });

    test('should return a copy of tasks array', () => {
      addTask('Task 1');
      const tasks1 = getAllTasks();
      const tasks2 = getAllTasks();
      expect(tasks1).not.toBe(tasks2);
    });
  });

  describe('completeTask', () => {
    test('should mark task as completed', () => {
      const task = addTask('Buy milk');
      const completed = completeTask(task.id);
      expect(completed.completed).toBe(true);
    });

    test('should throw error for non-existent task', () => {
      expect(() => completeTask(999)).toThrow('Task with ID 999 not found');
    });

    test('should return the completed task', () => {
      const task = addTask('Buy milk');
      const completed = completeTask(task.id);
      expect(completed).toBe(task);
    });
  });

  describe('isDuplicate', () => {
    test('should detect duplicate text with no due date', () => {
      addTask('Buy milk');
      expect(isDuplicate('Buy milk', null)).toBe(true);
    });

    test('should detect duplicate with same due date', () => {
      const date = new Date('2025-12-31');
      addTask('Task', { dueDate: date });
      expect(isDuplicate('Task', date)).toBe(true);
    });

    test('should not detect duplicate with different due date', () => {
      addTask('Task', { dueDate: new Date('2025-12-31') });
      expect(isDuplicate('Task', new Date('2026-01-01'))).toBe(false);
    });

    test('should not detect duplicate for different text', () => {
      addTask('Buy milk');
      expect(isDuplicate('Buy bread', null)).toBe(false);
    });
  });

  describe('isToday', () => {
    test('should return true for today\'s date', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    test('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    test('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });

    test('should ignore time component', () => {
      const today = new Date();
      today.setHours(23, 59, 59);
      expect(isToday(today)).toBe(true);
    });

    test('should return false for non-Date input', () => {
      expect(isToday('2025-12-31')).toBe(false);
      expect(isToday(null)).toBe(false);
    });
  });

  describe('filterDueToday', () => {
    test('should filter tasks due today', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      addTask('Today task', { dueDate: today });
      addTask('Tomorrow task', { dueDate: tomorrow });
      addTask('No date task');

      const todayTasks = filterDueToday();
      expect(todayTasks).toHaveLength(1);
      expect(todayTasks[0].text).toBe('Today task');
    });

    test('should return empty array when no tasks due today', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      addTask('Tomorrow task', { dueDate: tomorrow });

      expect(filterDueToday()).toEqual([]);
    });
  });

  describe('filterHighPriority', () => {
    test('should filter high priority tasks', () => {
      addTask('High priority task', { priority: 'high' });
      addTask('Normal task');
      addTask('Another high priority', { priority: 'high' });

      const highTasks = filterHighPriority();
      expect(highTasks).toHaveLength(2);
      highTasks.forEach(task => expect(task.priority).toBe('high'));
    });

    test('should return empty array when no high priority tasks', () => {
      addTask('Normal task');
      expect(filterHighPriority()).toEqual([]);
    });
  });

  describe('formatTask', () => {
    test('should format incomplete task', () => {
      const task = { id: 1, text: 'Buy milk', completed: false, priority: 'normal', dueDate: null };
      const formatted = formatTask(task);
      expect(formatted).toContain('[ ]');
      expect(formatted).toContain('Buy milk');
      expect(formatted).toContain('#1');
    });

    test('should format completed task', () => {
      const task = { id: 1, text: 'Buy milk', completed: true, priority: 'normal', dueDate: null };
      const formatted = formatTask(task);
      expect(formatted).toContain('[✓]');
    });

    test('should format high priority task', () => {
      const task = { id: 1, text: 'Urgent', completed: false, priority: 'high', dueDate: null };
      const formatted = formatTask(task);
      expect(formatted).toContain('!');
    });

    test('should format task with due date', () => {
      const dueDate = new Date('2025-12-31');
      const task = { id: 1, text: 'Task', completed: false, priority: 'normal', dueDate };
      const formatted = formatTask(task);
      expect(formatted).toContain('2025-12-31');
      expect(formatted).toContain('due:');
    });
  });

  describe('Table-driven priority tests', () => {
    const priorityTests = [
      { priority: 'high', valid: true },
      { priority: 'normal', valid: true },
      { priority: 'urgent', valid: false },
      { priority: 'low', valid: false },
      { priority: '', valid: false },
    ];

    priorityTests.forEach(({ priority, valid }) => {
      test(`should ${valid ? 'accept' : 'reject'} priority "${priority}"`, () => {
        if (valid) {
          expect(() => addTask('Task', { priority })).not.toThrow();
        } else {
          expect(() => addTask('Task', { priority })).toThrow('Priority must be "high" or "normal"');
        }
        resetTasks();
      });
    });
  });
});
