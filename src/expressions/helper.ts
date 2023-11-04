import * as d3 from 'd3';
import jsep from 'jsep';
import { Dataset } from '../models/dataset';
import { RenderInfo } from '../models/render-info';
import {
  IBinaryOperation,
  IDatasetToDataset,
  IDatasetToValue,
  IUnaryOperation,
} from './types';

import { Moment } from 'moment';
import { IExprResolved } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isDivisorValid = (divisor: any): boolean => {
  // console.log("checking divisor");
  if (typeof divisor === 'number') {
    if (divisor === 0) return false;
  } else if (divisor instanceof Dataset) {
    if (
      divisor.values.some((v) => {
        return v === 0;
      })
    ) {
      return false;
    }
  }
  return true;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateBinaryOperands = (left: any, right: any): string => {
  if (typeof left === 'string') return left;
  if (typeof right === 'string') return right;
  if (
    typeof left !== 'number' &&
    !window.moment.isMoment(left) &&
    !(left instanceof Dataset)
  ) {
    return 'Error: invalid operant type';
  }
  if (
    typeof right !== 'number' &&
    !window.moment.isMoment(right) &&
    !(right instanceof Dataset)
  ) {
    return 'Error: invalid operant type';
  }
  return '';
};

export const DatasetToValue: IDatasetToValue = {
  // min value of a dataset
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  min: (dataset, _renderInfo) => {
    // return number
    return d3.min(dataset.values);
  },
  // the latest date with min value
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  minDate: (dataset, _renderInfo): Moment | string => {
    // return Moment
    const min = d3.min(dataset.values);
    if (Number.isNumber(min)) {
      const arrayDataset = Array.from(dataset);
      for (const dataPoint of arrayDataset.reverse()) {
        if (dataPoint.value !== null && dataPoint.value === min) {
          return dataPoint.date;
        }
      }
    }
    return 'Error: min not found';
  },
  // max value of a dataset
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  max: (dataset, _renderInfo): number => {
    // return number
    return d3.max(dataset.values);
  },
  // the latest date with max value
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxDate: (dataset, _renderInfo): Moment | string => {
    // return Moment
    const max = d3.max(dataset.values);
    if (Number.isNumber(max)) {
      const arrayDataset = Array.from(dataset);
      for (const dataPoint of arrayDataset.reverse()) {
        if (dataPoint.value !== null && dataPoint.value === max) {
          return dataPoint.date;
        }
      }
    }
    return 'Error: max not found';
  },
  // start date of a dataset
  // if datasetId not found, return overall startDate
  startDate: (dataset, renderInfo): Moment => {
    // return Moment
    if (dataset) {
      const startDate = dataset.startDate;
      if (startDate && startDate.isValid()) {
        return startDate;
      }
    }
    return renderInfo.startDate;
  },
  // end date of a dataset
  // if datasetId not found, return overall endDate
  endDate: (dataset, renderInfo): Moment => {
    // return Moment
    if (dataset) {
      const endDate = dataset.endDate;
      if (endDate && endDate.isValid()) {
        return endDate;
      }
    }
    return renderInfo.endDate;
  },
  // sum of all values in a dataset
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sum: (dataset, _renderInfo): number => {
    // return number
    return d3.sum(dataset.values);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  count: (_dataset, _renderInfo): string => {
    return "Error: deprecated function 'count'";
  },
  // number of occurrences of a target in a dataset
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  numTargets: (dataset, _renderInfo): number => {
    // return number
    return dataset.targetCount;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  days: (_dataset, _renderInfo): string => {
    return "Error: deprecated function 'days'";
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  numDays: (dataset, _renderInfo): number => {
    // return number
    return dataset.values.length;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  numDaysHavingData: (dataset, _renderInfo): number => {
    // return number
    return dataset.getLengthNotNull();
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxStreak: (dataset, _renderInfo): number => {
    // return number
    let streak = 0;
    let maxStreak = 0;
    for (const dataPoint of dataset) {
      if (dataPoint.value !== null) {
        streak++;
      } else {
        streak = 0;
      }
      if (streak >= maxStreak) {
        maxStreak = streak;
      }
    }
    return maxStreak;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxStreakStart: (dataset, _renderInfo): Moment => {
    // return Moment
    let streak = 0;
    let maxStreak = 0;
    let streakStart: Moment = null;
    let maxStreakStart: Moment = null;
    if (dataset) {
      for (const dataPoint of dataset) {
        if (dataPoint.value !== null) {
          if (streak === 0) {
            streakStart = dataPoint.date;
          }
          streak++;
        } else {
          streak = 0;
        }
        if (streak >= maxStreak) {
          maxStreak = streak;
          maxStreakStart = streakStart;
        }
      }
    }
    return maxStreakStart;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxStreakEnd: (dataset, _renderInfo): Moment => {
    // return Moment
    let streak = 0;
    let maxStreak = 0;
    let streakEnd: Moment = null;
    let maxStreakEnd: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = 0; ind < arrayDataset.length; ind++) {
        const point = arrayDataset[ind];
        let nextPoint = null;
        if (ind < arrayDataset.length - 1) {
          nextPoint = arrayDataset[ind + 1];
        }
        if (point.value !== null) {
          streak++;
          if (nextPoint?.value === null) {
            streakEnd = point.date;
          }
        } else {
          streak = 0;
        }
        if (streak >= maxStreak) {
          // console.log(streak);
          // console.log(maxStreak);
          maxStreak = streak;
          maxStreakEnd = streakEnd;
        }
      }
    }
    return maxStreakEnd;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxBreaks: (dataset, _renderInfo): number => {
    // return number
    let breaks = 0;
    let maxBreaks = 0;
    for (const dataPoint of dataset) {
      if (dataPoint.value === null) {
        breaks++;
      } else {
        breaks = 0;
      }
      if (breaks > maxBreaks) {
        maxBreaks = breaks;
      }
    }
    return maxBreaks;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxBreaksStart: (dataset, _renderInfo): Moment => {
    // return Moment
    let breaks = 0;
    let maxBreaks = 0;
    let breaksStart: Moment = null;
    let maxBreaksStart: Moment = null;
    if (dataset) {
      for (const dataPoint of dataset) {
        if (dataPoint.value === null) {
          if (breaks === 0) {
            breaksStart = dataPoint.date;
          }
          breaks++;
        } else {
          breaks = 0;
        }
        if (breaks >= maxBreaks) {
          maxBreaks = breaks;
          maxBreaksStart = breaksStart;
        }
      }
    }
    return maxBreaksStart;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxBreaksEnd: (dataset, _renderInfo): Moment => {
    // return Moment
    let breaks = 0;
    let maxBreaks = 0;
    let breaksEnd: Moment = null;
    let maxBreaksEnd: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = 0; ind < arrayDataset.length; ind++) {
        const point = arrayDataset[ind];
        let nextPoint = null;
        if (ind < arrayDataset.length - 1) {
          nextPoint = arrayDataset[ind + 1];
        }
        if (point.value === null) {
          breaks++;
          if (nextPoint?.value !== null) {
            breaksEnd = point.date;
          }
        } else {
          breaks = 0;
        }
        if (breaks >= maxBreaks) {
          maxBreaks = breaks;
          maxBreaksEnd = breaksEnd;
        }
      }
    }
    return maxBreaksEnd;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lastStreak: (_dataset, _renderInfo): string =>
    "Error: deprecated function 'lastStreak'",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentStreak: (dataset, _renderInfo): number => {
    // return number
    let currentStreak = 0;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (point.value === null) {
          break;
        } else {
          currentStreak++;
        }
      }
    }
    return currentStreak;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentStreakStart: (dataset, _renderInfo): Moment | string => {
    // return Moment
    let currentStreak = 0;
    let currentStreakStart: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (ind < arrayDataset.length - 1) {
          currentStreakStart = arrayDataset[ind + 1].date;
        }
        if (point.value === null) {
          break;
        } else {
          // What is this doing?
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          currentStreak++;
        }
      }
    }

    if (currentStreakStart === null) {
      return 'Error: absent';
    }
    return currentStreakStart;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentStreakEnd: (dataset, _renderInfo): Moment | string => {
    // return Moment
    let currentStreak = 0;
    let currentStreakEnd: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (point.value === null) {
          break;
        } else {
          if (currentStreak === 0) {
            currentStreakEnd = point.date;
          }
          currentStreak++;
        }
      }
    }

    if (currentStreakEnd === null) {
      return 'Error: absent';
    }
    return currentStreakEnd;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentBreaks: (dataset, _renderInfo): number => {
    // return number
    let currentBreaks = 0;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (point.value === null) {
          currentBreaks++;
        } else {
          break;
        }
      }
    }
    return currentBreaks;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentBreaksStart: (dataset, _renderInfo): Moment | string => {
    // return Moment
    let currentBreaks = 0;
    let currentBreaksStart: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (ind < arrayDataset.length - 1) {
          currentBreaksStart = arrayDataset[ind + 1].date;
        }
        if (point.value === null) {
          // What is this doing?
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          currentBreaks++;
        } else {
          break;
        }
      }
    }

    if (currentBreaksStart === null) {
      return 'Error: absent';
    }
    return currentBreaksStart;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentBreaksEnd: (dataset, _renderInfo): Moment | string => {
    // return Moment
    let currentBreaks = 0;
    let currentBreaksEnd: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (point.value === null) {
          if (currentBreaks === 0) {
            currentBreaksEnd = point.date;
          }
          currentBreaks++;
        } else {
          break;
        }
      }
    }

    if (currentBreaksEnd === null) {
      return 'Error: absent';
    }
    return currentBreaksEnd;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  average: (dataset, _renderInfo): number | string => {
    // return number
    const countNotNull = dataset.getLengthNotNull();
    if (!isDivisorValid(countNotNull)) {
      return 'Error: divide by zero in expression';
    }
    const sum = d3.sum(dataset.values);
    return sum / countNotNull;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  median: (dataset, _renderInfo): number => d3.median(dataset.values),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variance: (dataset, _renderInfo): number => d3.variance(dataset.values),
};

export const UnaryOperation: IUnaryOperation = {
  '-': (u): number | Dataset | string => {
    if (typeof u === 'number') {
      return -1 * u;
    } else if (u instanceof Dataset) {
      const tmpDataset = u.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = -1 * value;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '-'";
  },
  '+': (u): number | Dataset | string => {
    if (typeof u === 'number') {
      return u;
    } else if (u instanceof Dataset) {
      const tmpDataset = u.clone();
      return tmpDataset;
    }
    return "Error: unknown operation for '+'";
  },
};

export const BinaryOperation: IBinaryOperation = {
  '+': (l, r): number | Dataset | string => {
    if (typeof l === 'number' && typeof r === 'number') {
      // return number
      return l + r;
    } else if (typeof l === 'number' && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = r.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = l + value;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && typeof r === 'number') {
      // return Dataset
      const tmpDataset = l.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value + r;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = l.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value + r.values[index];
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '+'";
  },
  '-': (l, r): number | Dataset | string => {
    if (typeof l === 'number' && typeof r === 'number') {
      // return number
      return l - r;
    } else if (typeof l === 'number' && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = r.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = l - value;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && typeof r === 'number') {
      // return Dataset
      const tmpDataset = l.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value - r;
        } else {
          array[index] = null;
        }
      });
      return tmpDataset;
    } else if (l instanceof Dataset && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = l.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value - r.values[index];
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '-'";
  },
  '*': (l, r): number | Dataset | string => {
    if (typeof l === 'number' && typeof r === 'number') {
      // return number
      return l * r;
    } else if (typeof l === 'number' && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = r.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = l * value;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && typeof r === 'number') {
      // return Dataset
      const tmpDataset = l.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value * r;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = l.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value * r.values[index];
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '*'";
  },
  '/': (l, r): number | Dataset | string => {
    if (!isDivisorValid(r)) {
      return 'Error: divide by zero in expression';
    }
    if (typeof l === 'number' && typeof r === 'number') {
      // return number
      return l / r;
    } else if (typeof l === 'number' && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = r.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = l / value;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && typeof r === 'number') {
      // return Dataset
      const tmpDataset = l.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value / r;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = l.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value / r.values[index];
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '/'";
  },
  '%': (l, r): number | Dataset | string => {
    if (!isDivisorValid(r)) {
      return 'Error: divide by zero in expression';
    }
    if (typeof l === 'number' && typeof r === 'number') {
      // return number
      return l % r;
    } else if (typeof l === 'number' && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = r.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = l % value;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && typeof r === 'number') {
      // return Dataset
      const tmpDataset = l.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value % r;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = l.clone();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value % r.values[index];
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateYMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '%'";
  },
};

export const DatasetToDataset: IDatasetToDataset = {
  // min value of a dataset
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  normalize: (dataset, _args, _renderInfo): Dataset | string => {
    // console.log("normalize");
    // console.log(dataset);
    const yMin = dataset.yMin;
    const yMax = dataset.yMax;
    // console.log(`yMin/yMax: ${yMin}/${yMax}`);
    if (yMin !== null && yMax !== null && yMax > yMin) {
      const normalized = dataset.clone();
      normalized.values.forEach((value, index, array) => {
        array[index] = (value - yMin) / (yMax - yMin);
      });
      normalized.recalculateYMinMax();
      return normalized;
    }
    return "Error: invalid data range for function 'normalize'";
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setMissingValues: (dataset, args, _renderInfo): Dataset | string => {
    // console.log("setMissingValues");
    // console.log(dataset);
    // console.log(args);
    if (args && args.length > 0) {
      const missingValue = args[0];
      // console.log(missingValue);
      const newDataset = dataset.clone();
      if (Number.isNumber(missingValue) && !Number.isNaN(missingValue)) {
        newDataset.values.forEach((value, index, array) => {
          if (value === null) {
            array[index] = missingValue as number;
          }
        });
        newDataset.recalculateYMinMax();
        return newDataset;
      }
      return "Error: invalid arguments for function 'setMissingValues'";
    }
    return "Error: invalid arguments for function 'setMissingValues";
  },
};

export const getDatasetById = (
  datasetId: number,
  renderInfo: RenderInfo
): Dataset => renderInfo.datasets.getDatasetById(datasetId);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const evaluateArray = (arr: any, renderInfo: RenderInfo): any =>
  arr.map((expr: jsep.Expression) => evaluate(expr, renderInfo));

export const evaluate = (
  expr: jsep.Expression,
  renderInfo: RenderInfo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  // console.log(expr);
  switch (expr.type) {
    case 'Literal':
      const literalExpr = expr as jsep.Literal;
      return literalExpr.value; // string, number, boolean

    case 'Identifier':
      const identifierExpr = expr as jsep.Identifier;
      const identifierName = identifierExpr.name;
      if (identifierName in DatasetToValue) {
        return `Error: deprecated template variable '${identifierName}', use '${identifierName}()' instead`;
      } else if (identifierName in DatasetToDataset) {
        return `Error: deprecated template variable '${identifierName}', use '${identifierName}()' instead`;
      }
      return `Error: unknown function name '${identifierName}'`;

    case 'UnaryExpression':
      const unaryExpr = expr as jsep.UnaryExpression;
      const retUnaryArg = evaluate(unaryExpr.argument, renderInfo);
      if (typeof retUnaryArg === 'string') {
        return retUnaryArg;
      }
      return UnaryOperation[unaryExpr.operator](retUnaryArg);

    case 'BinaryExpression':
      const binaryExpr = expr as jsep.BinaryExpression;
      const leftValue = evaluate(binaryExpr.left, renderInfo);
      const rightValue = evaluate(binaryExpr.right, renderInfo);
      const retCheck = validateBinaryOperands(leftValue, rightValue);
      if (typeof retCheck === 'string' && retCheck.startsWith('Error:')) {
        return retCheck;
      }
      return BinaryOperation[binaryExpr.operator](leftValue, rightValue);

    case 'CallExpression':
      const callExpr = expr as jsep.CallExpression;

      const calleeIdentifier = callExpr.callee as jsep.Identifier;
      const fnName = calleeIdentifier.name;
      const args = callExpr.arguments;
      // console.log(fnName);
      // console.log(args);
      const evaluatedArgs = evaluateArray(args, renderInfo);
      if (typeof evaluatedArgs === 'string') return evaluatedArgs;

      // function dataset accept only one arg in number
      if (fnName === 'dataset') {
        if (evaluatedArgs.length === 1) {
          const arg = evaluatedArgs[0];
          if (typeof arg === 'string') return arg;
          if (typeof arg !== 'number') {
            return "Error: function 'dataset' only accepts id in number";
          }
          const dataset = getDatasetById(arg, renderInfo);
          if (!dataset) {
            return `Error: no dataset found for id '${arg}'`;
          }
          return dataset;
        }
      }

      // fnDataset accept only one arg in number or Dataset
      else if (fnName in DatasetToValue) {
        if (evaluatedArgs.length === 0) {
          // Use first non-X dataset
          let dataset = null;
          for (const ds of renderInfo.datasets) {
            if (!dataset && !ds.query.usedAsXDataset) {
              dataset = ds;
              // if breaks here, the index of Datasets not reset???
            }
          }
          if (!dataset) {
            return `No available dataset found for function ${fnName}`;
          }
          return DatasetToValue[fnName](dataset, renderInfo);
        }
        if (evaluatedArgs.length === 1) {
          const arg = evaluatedArgs[0];
          if (typeof arg === 'string') return arg;
          if (arg instanceof Dataset) {
            return DatasetToValue[fnName](arg, renderInfo);
          } else {
            return `Error: function '${fnName}' only accepts Dataset`;
          }
        }
        return `Error: Too many arguments for function ${fnName}`;
      } else if (fnName in DatasetToDataset) {
        if (evaluatedArgs.length === 1) {
          if (typeof evaluatedArgs[0] === 'string') return evaluatedArgs[0]; // error message
          if (evaluatedArgs[0] instanceof Dataset) {
            const dataset = evaluatedArgs[0];
            return DatasetToDataset[fnName](dataset, null, renderInfo);
          } else {
            return `Error: function ${fnName} only accept Dataset`;
          }
        } else if (evaluatedArgs.length > 1) {
          if (typeof evaluatedArgs[0] === 'string') {
            return evaluatedArgs[0];
          }
          if (evaluatedArgs[0] instanceof Dataset) {
            const dataset = evaluatedArgs[0];
            return DatasetToDataset[fnName](
              dataset,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
              evaluatedArgs.filter((_value: any, index: number, _arr: any) => {
                return index > 0;
              }),
              renderInfo
            );
          } else {
            return `Error: function ${fnName} only accept Dataset`;
          }
        }
        return `Error: Too many arguments for function ${fnName}`;
      }
      return `Error: unknown function name '${fnName}'`;
  }
  return 'Error: unknown expression';
};

export const resolve = (
  text: string,
  renderInfo: RenderInfo
): Array<IExprResolved> | string => {
  // console.log(text);
  const exprMap: Array<IExprResolved> = [];

  // {{(?<expr>[\w+\-*\/0-9\s()\[\]%.]+)(::(?<format>[\w+\-*\/0-9\s()\[\]%.:]+))?}}
  const strExprRegex =
    '{{(?<expr>[\\w+\\-*\\/0-9\\s()\\[\\]%.,]+)(::(?<format>[\\w+\\-*\\/0-9\\s()\\[\\]%.:]+))?}}';
  const exprRegex = new RegExp(strExprRegex, 'gm');
  let match;
  while ((match = exprRegex.exec(text))) {
    // console.log(match);
    const fullMatch = match[0];
    if (exprMap.some((e) => e.source === fullMatch)) continue;

    if (typeof match.groups !== 'undefined') {
      if (typeof match.groups.expr !== 'undefined') {
        const expr = match.groups.expr;

        let ast = null;
        try {
          ast = jsep(expr);
        } catch (err) {
          return 'Error:' + err.message;
        }
        if (!ast) {
          return 'Error: failed to parse expression';
        }
        // console.log(ast);
        const value = evaluate(ast, renderInfo);
        if (typeof value === 'string') {
          return value; // error message
        }

        if (typeof value === 'number' || window.moment.isMoment(value)) {
          let format = null;
          if (typeof match.groups.format !== 'undefined') {
            format = match.groups.format;
          }

          exprMap.push({
            source: fullMatch,
            value: value,
            format: format,
          });
        }
      }
    }
  }

  return exprMap;
};
