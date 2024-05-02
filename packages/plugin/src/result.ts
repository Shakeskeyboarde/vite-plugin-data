import { isGlobMatch } from './utils/is-glob-match.js';

interface Options {
  dependencies?: string[];
  dependencyPatterns?: string[];
  exports?: Record<string, unknown>;
}

/**
 * A collection of dependency filenames and glob patterns. This is intended
 * to be used with HMR to invalidate modules related to the data loader file.
 */
export class Result {
  /**
   * Absolute filenames of dependencies collected from import and require
   * statements when bundling a data loader.
   */
  readonly dependencies: readonly string[];

  /**
   * Normalized dependency glob patterns parsed from the data loader
   * configuration comment.
   */
  readonly dependencyPatterns: readonly string[];

  /**
   * Data loader exports.
   */
  exports: Record<string, unknown>;

  /**
   * Create a new {@link Result} instance.
   */
  constructor({ dependencies = [], dependencyPatterns = [], exports = {} }: Options = {}) {
    this.dependencies = dependencies;
    this.dependencyPatterns = dependencyPatterns;
    this.exports = exports;
  }

  /**
   * Return true if the absolute filename matches a dependency or dependency
   * glob pattern.
   */
  dependsOn(filename: string): boolean {
    return this.dependencies.includes(filename) || isGlobMatch(filename, Array.from(this.dependencyPatterns));
  }
}
