import { Reducer } from 'react';

import {
  Action,
  ActionType,
  InputState,
  SetValueAction,
  SetValidationAction,
  RemoveInputAction,
} from './types';

import { allFieldsValid } from './validation';

export const createInitialState = <Inputs>(): InputState<Inputs> => ({
  touched: {},
  valid: true,
  validating: {},
  validation: {},
  values: {},
});

export type OxinReducer<Inputs> = (
  state: InputState<Inputs>,
  action: Action<Inputs>,
) => InputState<Inputs>;

export const createReducer = <Inputs>(): Reducer<
  InputState<Inputs>,
  Action<Inputs>
> => (state, action) => {
  switch (action.type) {
    case ActionType.SET_VALUE: {
      const {
        payload: { fromInitial, name, value },
      } = action as SetValueAction<keyof Inputs, unknown>;

      const newState: InputState<Inputs> = {
        ...state,
        touched: {
          ...state.touched,
          [name]: !fromInitial,
        },
        values: {
          ...state.values,
          [name]: value,
        },
        validating: {
          ...state.validating,
          [name]: true,
        },
      };

      return newState;
    }

    case ActionType.SET_VALIDATION: {
      const {
        payload: { fieldName, validation },
      } = action as SetValidationAction<keyof Inputs>;

      const newState: InputState<Inputs> = {
        ...state,
        validating: {
          ...state.validating,
          [fieldName]: false,
        },
        validation: {
          ...state.validation,
          [fieldName]: {
            ...state.validation[fieldName],
            ...validation,
          },
        },
      };

      newState.valid = allFieldsValid(newState);

      return newState;
    }

    case ActionType.REMOVE_FIELD: {
      const {
        payload: { name },
      } = action as RemoveInputAction<keyof Inputs>;

      const newState = {
        ...state,
      };

      delete newState.touched[name as keyof Inputs];
      delete newState.validation[name as keyof Inputs];
      delete newState.values[name as keyof Inputs];
      delete newState.validating[name as keyof Inputs];

      newState.valid = allFieldsValid(newState);

      return newState;
    }
    default:
      return state;
  }
};
