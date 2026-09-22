'use client';

import {
  type ChangeEvent,
  useEffect,
  useState,
} from 'react';

type NumberStepperProps = {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  quickValues?: number[];
};

type Option = {
  label: string;
  value: string;
};

type OptionSelectorProps = {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

type RatingSelectorProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

type PickerFieldProps = {
  label: string;
  value: string;
  onPress: () => void;
};

type DateTimePickerSheetProps = {
  visible: boolean;
  title: string;
  value: Date;
  mode: 'date' | 'time';
  onChange: (value: Date) => void;
  onClose: () => void;
};

function ratingColor(
  value: number
) {
  if (value === 1) {
    return '#FF453A';
  }

  if (value === 2) {
    return '#FF9F0A';
  }

  if (value === 3) {
    return '#FFD60A';
  }

  if (value === 4) {
    return '#34C759';
  }

  return '#30D158';
}

function ratingTint(
  value: number
) {
  if (value === 1) {
    return 'rgba(255, 69, 58, 0.10)';
  }

  if (value === 2) {
    return 'rgba(255, 159, 10, 0.10)';
  }

  if (value === 3) {
    return 'rgba(255, 214, 10, 0.10)';
  }

  if (value === 4) {
    return 'rgba(52, 199, 89, 0.10)';
  }

  return 'rgba(48, 209, 88, 0.10)';
}

function formatDateInput(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}

function formatTimeInput(
  date: Date
) {
  const hours =
    String(
      date.getHours()
    ).padStart(
      2,
      '0'
    );

  const minutes =
    String(
      date.getMinutes()
    ).padStart(
      2,
      '0'
    );

  return `${hours}:${minutes}`;
}

function parseDateInput(
  value: string,
  current: Date
) {
  const parts =
    value.split('-').map(
      Number
    );

  if (
    parts.length !== 3 ||
    parts.some(
      (part) =>
        !Number.isFinite(
          part
        )
    )
  ) {
    return current;
  }

  const [
    year,
    month,
    day,
  ] = parts;

  const next =
    new Date(
      current
    );

  next.setFullYear(
    year,
    month - 1,
    day
  );

  return next;
}

function parseTimeInput(
  value: string,
  current: Date
) {
  const parts =
    value.split(':').map(
      Number
    );

  if (
    parts.length < 2 ||
    parts.some(
      (part) =>
        !Number.isFinite(
          part
        )
    )
  ) {
    return current;
  }

  const [
    hours,
    minutes,
  ] = parts;

  const next =
    new Date(
      current
    );

  next.setHours(
    hours,
    minutes,
    0,
    0
  );

  return next;
}

export function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
  quickValues = [],
}: NumberStepperProps) {
  function decrease() {
    onChange(
      Math.max(
        min,
        Number(
          (
            value -
            step
          ).toFixed(
            4
          )
        )
      )
    );
  }

  function increase() {
    onChange(
      Math.min(
        max,
        Number(
          (
            value +
            step
          ).toFixed(
            4
          )
        )
      )
    );
  }

  return (
    <div className="control-block">
      {label ? (
        <div className="control-label">
          {label}
        </div>
      ) : null}

      <div className="stepper">
        <button
          type="button"
          className="stepper-button"
          disabled={
            value <= min
          }
          onClick={
            decrease
          }
        >
          −
        </button>

        <div className="stepper-value-wrap">
          <span className="stepper-value">
            {value}
          </span>

          {suffix ? (
            <span className="stepper-suffix">
              {suffix}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className="stepper-button"
          disabled={
            value >= max
          }
          onClick={
            increase
          }
        >
          +
        </button>
      </div>

      {quickValues.length >
      0 ? (
        <div className="quick-values">
          {quickValues.map(
            (
              quickValue
            ) => {
              const active =
                value ===
                quickValue;

              return (
                <button
                  key={
                    quickValue
                  }
                  type="button"
                  className={
                    active
                      ? 'quick-value active'
                      : 'quick-value'
                  }
                  onClick={() =>
                    onChange(
                      quickValue
                    )
                  }
                >
                  {quickValue}
                  {suffix ===
                  'minutes'
                    ? 'm'
                    : suffix
                      ? ` ${suffix}`
                      : ''}
                </button>
              );
            }
          )}
        </div>
      ) : null}
    </div>
  );
}

export function OptionSelector({
  label,
  value,
  options,
  onChange,
}: OptionSelectorProps) {
  return (
    <div className="control-block">
      {label ? (
        <div className="control-label">
          {label}
        </div>
      ) : null}

      <div className="option-selector">
        {options.map(
          (
            option
          ) => {
            const active =
              option.value ===
              value;

            return (
              <button
                key={
                  option.value
                }
                type="button"
                className={
                  active
                    ? 'option-button active'
                    : 'option-button'
                }
                onClick={() =>
                  onChange(
                    option.value
                  )
                }
              >
                {
                  option.label
                }
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

export function RatingSelector({
  label,
  value,
  onChange,
}: RatingSelectorProps) {
  return (
    <div
      className="rating-selector"
      style={{
        borderColor:
          ratingColor(
            value
          ),

        background:
          ratingTint(
            value
          ),
      }}
    >
      <div className="rating-header">
        <span className="rating-title">
          {label}
        </span>

        <span
          className="rating-current"
          style={{
            color:
              ratingColor(
                value
              ),
          }}
        >
          {value}/5
        </span>
      </div>

      <div className="rating-options">
        {[
          1,
          2,
          3,
          4,
          5,
        ].map(
          (
            number
          ) => {
            const color =
              ratingColor(
                number
              );

            const active =
              value ===
              number;

            return (
              <button
                key={
                  number
                }
                type="button"
                className="rating-button"
                style={{
                  borderColor:
                    color,

                  background:
                    active
                      ? color
                      : 'transparent',

                  color:
                    active
                      ? '#090A0C'
                      : color,
                }}
                onClick={() =>
                  onChange(
                    number
                  )
                }
              >
                {number}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

export function PickerField({
  label,
  value,
  onPress,
}: PickerFieldProps) {
  return (
    <div className="control-block">
      <div className="control-label">
        {label}
      </div>

      <button
        type="button"
        className="picker-field"
        onClick={
          onPress
        }
      >
        <span className="picker-value">
          {value}
        </span>

        <span className="picker-right">
          <span className="picker-change">
            CHANGE
          </span>

          <span className="picker-arrow">
            ›
          </span>
        </span>
      </button>
    </div>
  );
}

export function DateTimePickerSheet({
  visible,
  title,
  value,
  mode,
  onChange,
  onClose,
}: DateTimePickerSheetProps) {
  const [
    draftValue,
    setDraftValue,
  ] =
    useState(
      mode === 'date'
        ? formatDateInput(
            value
          )
        : formatTimeInput(
            value
          )
    );

  useEffect(() => {
    if (
      !visible
    ) {
      return;
    }

    setDraftValue(
      mode === 'date'
        ? formatDateInput(
            value
          )
        : formatTimeInput(
            value
          )
    );
  }, [
    visible,
    value,
    mode,
  ]);

  if (
    !visible
  ) {
    return null;
  }

  function handleChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const nextValue =
      event.target.value;

    setDraftValue(
      nextValue
    );

    if (
      mode === 'date'
    ) {
      onChange(
        parseDateInput(
          nextValue,
          value
        )
      );
    } else {
      onChange(
        parseTimeInput(
          nextValue,
          value
        )
      );
    }
  }

  return (
    <div
      className="sheet-overlay"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="Close"
        onClick={
          onClose
        }
      />

      <div className="picker-sheet">
        <div className="sheet-handle" />

        <div className="picker-sheet-header">
          <div>
            <div className="control-label">
              SELECT
            </div>

            <div className="picker-sheet-title">
              {title}
            </div>
          </div>

          <button
            type="button"
            className="picker-done"
            onClick={
              onClose
            }
          >
            DONE
          </button>
        </div>

        <div className="native-picker-wrap">
          <input
            className="native-picker"
            type={
              mode === 'date'
                ? 'date'
                : 'time'
            }
            step={
              mode === 'time'
                ? 300
                : undefined
            }
            value={
              draftValue
            }
            onChange={
              handleChange
            }
          />
        </div>
      </div>
    </div>
  );
}

