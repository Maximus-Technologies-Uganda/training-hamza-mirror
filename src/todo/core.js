/**
 * To-Do task structure:
 * {
 *   id: number,
 *   text: string,
 *   dueDate: Date | null,
 *   priority: 'high' | 'normal',
 *   completed: boolean
 * }
 */

let taskIdCounter = 1;
const tasks = [];

/**
 * Reset tasks (for testing)
 */
export function resetTasks() {
  tasks.length = 0;
  taskIdCounter = 1;
}

/**
 * Get all tasks
 * @returns {Array} Array of tasks
 */
export function getAllTasks() {
  return [...tasks];
}

/**
 * Check if a task with the same text and due date already exists
 * @param {string} text - Task text
 * @param {Date|null} dueDate - Due date
 * @returns {boolean} True if duplicate exists
 */
export function isDuplicate(text, dueDate) {
  return tasks.some(task => {
    const sameText = task.text === text;
    const sameDueDate = (task.dueDate === null && dueDate === null) ||
                        (task.dueDate && dueDate && task.dueDate.getTime() === dueDate.getTime());
    return sameText && sameDueDate;
  });
}

/**
 * Add a new task
 * @param {string} text - Task description
 * @param {Object} options - Task options
 * @param {Date} options.dueDate - Due date
 * @param {string} options.priority - Priority level ('high' or 'normal')
 * @returns {Object} The created task
 * @throws {Error} If validation fails or duplicate exists
 */
export function addTask(text, options = {}) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Task text is required');
  }

  const dueDate = options.dueDate || null;
  const priority = options.priority !== undefined ? options.priority : 'normal';

  if (priority === '' || (priority !== 'high' && priority !== 'normal')) {
    throw new Error('Priority must be "high" or "normal"');
  }

  if (dueDate && !(dueDate instanceof Date)) {
    throw new Error('Due date must be a Date object');
  }

  if (isDuplicate(text, dueDate)) {
    throw new Error('Duplicate task');
  }

  const task = {
    id: taskIdCounter++,
    text: text.trim(),
    dueDate,
    priority,
    completed: false
  };

  tasks.push(task);
  return task;
}

/**
 * Mark a task as completed
 * @param {number} id - Task ID
 * @returns {Object} The completed task
 * @throws {Error} If task not found
 */
export function completeTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) {
    throw new Error(`Task with ID ${id} not found`);
  }
  task.completed = true;
  return task;
}

/**
 * Check if a date is today (ignores time)
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
  if (!(date instanceof Date)) {
    return false;
  }
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

/**
 * Filter tasks due today
 * @param {Array} taskList - Array of tasks
 * @returns {Array} Tasks due today
 */
export function filterDueToday(taskList = tasks) {
  return taskList.filter(task => task.dueDate && isToday(task.dueDate));
}

/**
 * Filter high priority tasks
 * @param {Array} taskList - Array of tasks
 * @returns {Array} High priority tasks
 */
export function filterHighPriority(taskList = tasks) {
  return taskList.filter(task => task.priority === 'high');
}

/**
 * Format a task for display
 * @param {Object} task - Task object
 * @returns {string} Formatted task string
 */
export function formatTask(task) {
  const status = task.completed ? '✓' : ' ';
  const priority = task.priority === 'high' ? '!' : ' ';
  const dueDate = task.dueDate ? ` (due: ${task.dueDate.toISOString().split('T')[0]})` : '';
  return `[${status}] ${priority} #${task.id}: ${task.text}${dueDate}`;
}
