/**
 * Formats milliseconds into MM:SS.mmm format
 * @param {number} ms - Milliseconds to format
 * @returns {string} Formatted time string
 */
export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const mmm = String(milliseconds).padStart(3, '0');

  return `${mm}:${ss}.${mmm}`;
}

/**
 * Creates a new stopwatch instance
 * @returns {Object} Stopwatch with start, lap, stop, and elapsedMs methods
 */
export function createStopwatch() {
  let startTime = null;
  let stopTime = null;
  let isRunning = false;

  return {
    /**
     * Starts the stopwatch
     * @throws {Error} If stopwatch is already running
     */
    start() {
      if (isRunning) {
        throw new Error('Stopwatch already running');
      }
      startTime = Date.now();
      stopTime = null;
      isRunning = true;
    },

    /**
     * Records a lap time
     * @returns {number} Elapsed milliseconds at lap time
     * @throws {Error} If stopwatch is not started
     */
    lap() {
      if (!isRunning) {
        throw new Error('Stopwatch not started');
      }
      return Date.now() - startTime;
    },

    /**
     * Stops the stopwatch
     * @throws {Error} If stopwatch is not started
     */
    stop() {
      if (!isRunning) {
        throw new Error('Stopwatch not started');
      }
      stopTime = Date.now();
      isRunning = false;
    },

    /**
     * Gets elapsed time in milliseconds
     * @returns {number} Elapsed milliseconds
     * @throws {Error} If stopwatch has never been started
     */
    elapsedMs() {
      if (startTime === null) {
        throw new Error('Stopwatch not started');
      }
      if (isRunning) {
        return Date.now() - startTime;
      }
      return stopTime - startTime;
    }
  };
}
