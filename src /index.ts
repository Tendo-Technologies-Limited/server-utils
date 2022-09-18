'use strict';
import { ForbiddenError } from 'apollo-server';
import { skip } from 'graphql-resolvers';

import _ from 'lodash';

const filterDictionary = {
  gt: '$gt',
  lt: '$lt',
  in: '$in',
  notIn: '$notIn',
  eq: '$eq',
  between: '$between',
  regex: '$regexp',
  contains: '$contains',
  iLike: '$iLike',
  like: '$like',
  notLike: '$notLike',
  and: '$and',
  or: '$or',
  notEq: '$ne',
  ne: '$ne',
  nin: '$nin',
  gte: '$gte',
  lte: '$lte',
  nlike: '$nlike',
  nregex: '$nregex',
  notContains: '$notContains',
};

const joinFilterWithCondition = (filter: Record<string, any>, condition: string) => {
  return {
    [_.property(condition)(filterDictionary) as string]: Object.keys(filter).map((key) => ({
      [key]: filter[key],
    })),
  };
};

export const preprocessFilter = (filter: any, condition: string = 'or') => {
  const newFilter: Record<string, any> = {};
  if (!filter) return newFilter;
  _.map(_.keys(filter), (key) => {
    const value = _.property(key)(filterDictionary) as string;
    if (value) {
      newFilter[value] = filter[key];
      if (_.isArray(filter[key])) {
        newFilter[value] = filter[key];
      } else if (_.isObject(filter[key])) {
        newFilter[value] = preprocessFilter(filter[key]);
      } else if (_.isString(filter[key]) && key === 'like') {
        newFilter[value] = `%${filter[key]}%`;
      }
    } else {
      newFilter[key] = filter[key];
      if (_.isArray(filter[key])) {
        newFilter[key] = filter[key];
      } else if (_.isObject(filter[key])) {
        newFilter[key] = preprocessFilter(filter[key]);
      }
    }
  });
  return Object.keys(newFilter).length > 1 ? joinFilterWithCondition(newFilter, condition) : newFilter;
};

export const isAuthenticated = (_: any, __: any, { user }: any) =>
  user ? skip : new ForbiddenError('Not authenticated as user.');
