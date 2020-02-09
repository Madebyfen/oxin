import React from 'react';
import { act } from 'react-dom/test-utils';
import {
  render,
  cleanup,
  fireEvent,
  wait,
  RenderResult,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TestForm, TestInput } from '../test-components';
import { FieldOptions } from '../types';

jest.mock('lodash.debounce', () => jest.fn(fn => fn));

const required = (value: string) => !!value && !!value.length;
const maxLength = (value: string) => (value ? value.length <= 10 : true);
const asyncCheck = async (value: string) => {
  (() => new Promise(res => setTimeout(res, 600)))();

  return value === 'Correcto';
};

const inputs: FieldOptions[] = [
  { name: 'test1', type: 'text', initial: 'Initial value' },
  {
    name: 'test2',
    type: 'text',
    validators: [required],
  },
  {
    name: 'test3',
    type: 'text',
    validators: [
      [required, 'Give it some'],
      [maxLength, 'Too much'],
    ],
    validation: {
      onBlur: true,
    },
  },
  {
    name: 'test4',
    type: 'text',
    validators: [[asyncCheck, 'Not today']],
    validation: {
      debounce: 500,
    },
  },
];

const Form = () => (
  <TestForm>
    {(formState, propsCreator) => (
      <>
        <TestInput {...propsCreator(inputs[0])} />
        <TestInput {...propsCreator(inputs[1])} />
        <TestInput {...propsCreator(inputs[2])} />
        <TestInput {...propsCreator(inputs[3])} />
        <span data-testid="allValid">{formState.valid.toString()}</span>
      </>
    )}
  </TestForm>
);

let renderResult = {} as RenderResult;

describe('Props', () => {
  afterEach(cleanup);

  test('initial', async () => {
    await act(async () => {
      renderResult = render(<Form />);
    });
    const { getByTestId } = renderResult;

    expect(getByTestId('input-test1').getAttribute('value')).toBe(
      'Initial value',
    );
  });

  test('value', async () => {
    await act(async () => {
      renderResult = render(<Form />);
    });
    const { getByTestId } = renderResult;
    const input1 = getByTestId('input-test1');
    const input2 = getByTestId('input-test2');

    await act(async () => {
      userEvent.type(input1, 'Helo 1.');
      userEvent.type(input2, 'Helo 2.');
    });

    expect(input1.getAttribute('value')).toBe('Helo 1.');
    expect(input2.getAttribute('value')).toBe('Helo 2.');
  });

  test('valid', async () => {
    await act(async () => {
      renderResult = render(<Form />);
    });
    const { getByTestId } = renderResult;

    const input2 = getByTestId('input-test2');
    const input3 = getByTestId('input-test3');
    const valid1 = getByTestId('valid-test1');
    const valid2 = getByTestId('valid-test2');
    const valid3 = getByTestId('valid-test3');

    await act(async () => {
      userEvent.type(input2, 'Valid');
      userEvent.type(input3, 'Not so valid');
    });

    expect(valid1.textContent).toBe('true');
    expect(valid2.textContent).toBe('true');
    expect(valid3.textContent).toBe('false');

    await act(async () => {
      userEvent.type(input3, 'Also valid');
    });

    expect(valid3.textContent).toBe('true');
  });

  test('allValid', async () => {
    jest.useFakeTimers();

    await act(async () => {
      renderResult = render(<Form />);
    });
    const { getByTestId } = renderResult;

    const input2 = getByTestId('input-test2');
    const input3 = getByTestId('input-test3');
    const input4 = getByTestId('input-test4');
    const allValid = getByTestId('allValid');

    expect(allValid.textContent).toBe('false');

    await act(async () => {
      userEvent.type(input2, 'Valid');
      userEvent.type(input3, 'Also valid');
      userEvent.type(input4, 'Correcto');

      jest.runAllTimers();
    });

    expect(allValid.textContent).toBe('true');
  });

  test('validationMessages', async () => {
    await act(async () => {
      renderResult = render(<Form />);
    });
    const { getByTestId } = renderResult;

    const input3 = getByTestId('input-test3');
    const messages1 = getByTestId('validationMessages-test1');
    const messages2 = getByTestId('validationMessages-test2');
    const messages3 = getByTestId('validationMessages-test3');

    await act(async () => {
      userEvent.type(input3, 'Not so valid');
    });

    expect(messages1.textContent).toBe('');
    expect(messages2.textContent).toBe('');
    expect(messages3.textContent).toBe('Too much');
  });

  test('validation onBlur', async () => {
    await act(async () => {
      renderResult = render(<Form />);
    });
    const { getByTestId } = renderResult;

    const input2 = getByTestId('input-test2');
    const input3 = getByTestId('input-test3');
    const messages3 = getByTestId('validationMessages-test3');
    const valid2 = getByTestId('valid-test2');
    const valid3 = getByTestId('valid-test3');
    const touched2 = getByTestId('touched-test2');
    const touched3 = getByTestId('touched-test3');

    await act(async () => {
      fireEvent.blur(input2);
      fireEvent.blur(input3);
    });

    expect(valid2.textContent).toBe('false');
    expect(touched2.textContent).toBe('false');
    expect(valid3.textContent).toBe('false');
    expect(touched3.textContent).toBe('true');
    expect(messages3.textContent).toBe('Give it some');
  });

  test('async validation', async () => {
    jest.useFakeTimers();

    await act(async () => {
      renderResult = render(<Form />);
    });
    const { getByTestId } = renderResult;

    const input4 = getByTestId('input-test4');
    const messages4 = getByTestId('validationMessages-test4');
    const valid4 = getByTestId('valid-test4');
    const validating4 = getByTestId('valid-test4');

    await act(async () => {
      await wait(() => userEvent.type(input4, 'Correcto'));
      jest.runAllTimers();
    });

    expect(valid4.textContent).toBe('true');
    expect(messages4.textContent).toBe('');

    act(() => {
      userEvent.type(input4, 'Not so valid');
    });

    expect(valid4.textContent).toBe('true');
    expect(messages4.textContent).toBe('');
    expect(validating4.textContent).toBe('true');

    await act(async () => {
      jest.runAllTimers();
    });

    expect(valid4.textContent).toBe('false');
    expect(messages4.textContent).toBe('Not today');
    expect(validating4.textContent).toBe('false');
  });
});