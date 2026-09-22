'use client';

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

function ratingColor(value: number) {
  if (value === 1) return '#FF453A';
  if (value === 2) return '#FF9F0A';
  if (value === 3) return '#FFD60A';
  if (value === 4) return '#34C759';
  return '#30D158';
}

function clampToStep(
  value: number,
  min: number,
  max: number
) {
  return Math.min(max, Math.max(min, value));
}

function displayNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(2)));
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
          disabled={value <= min}
          aria-label="Decrease"
          onClick={() =>
            onChange(
              clampToStep(
                Number((value - step).toFixed(4)),
                min,
                max
              )
            )
          }
        >
          −
        </button>

        <div className="stepper-value">
          <span>
            {displayNumber(value)}
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
          disabled={value >= max}
          aria-label="Increase"
          onClick={() =>
            onChange(
              clampToStep(
                Number((value + step).toFixed(4)),
                min,
                max
              )
            )
          }
        >
          +
        </button>
      </div>

      {quickValues.length > 0 ? (
        <div className="quick-values">
          {quickValues.map((quickValue) => {
            const active = value === quickValue;

            return (
              <button
                type="button"
                key={quickValue}
                className={
                  active
                    ? 'quick-value-button active'
                    : 'quick-value-button'
                }
                onClick={() =>
                  onChange(
                    clampToStep(
                      quickValue,
                      min,
                      max
                    )
                  )
                }
              >
                {displayNumber(quickValue)}
                {suffix
                  ? ` ${suffix}`
                  : ''}
              </button>
            );
          })}
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
        {options.map((option) => {
          const active =
            option.value === value;

          return (
            <button
              type="button"
              key={option.value}
              className={
                active
                  ? 'option-button active'
                  : 'option-button'
              }
              onClick={() =>
                onChange(option.value)
              }
            >
              {option.label}
            </button>
          );
        })}
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
    <div className="control-block">
      <div className="control-label">
        {label}
      </div>

      <div className="rating-selector">
        {[1, 2, 3, 4, 5].map(
          (number) => {
            const active =
              value === number;

            return (
              <button
                type="button"
                key={number}
                className={
                  active
                    ? 'rating-button active'
                    : 'rating-button'
                }
                style={
                  active
                    ? {
                        background:
                          ratingColor(number),
                        borderColor:
                          ratingColor(number),
                      }
                    : {
                        borderColor:
                          ratingColor(number),
                      }
                }
                onClick={() =>
                  onChange(number)
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
        onClick={onPress}
      >
        <span className="picker-field-value">
          {value}
        </span>

        <span className="picker-field-arrow">
          ›
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
  if (!visible) {
    return null;
  }

  const inputValue =
    mode === 'date'
      ? [
          value.getFullYear(),
          String(
            value.getMonth() + 1
          ).padStart(2, '0'),
          String(
            value.getDate()
          ).padStart(2, '0'),
        ].join('-')
      : [
          String(
            value.getHours()
          ).padStart(2, '0'),
          String(
            value.getMinutes()
          ).padStart(2, '0'),
        ].join(':');

  function handleValueChange(
    nextValue: string
  ) {
    if (!nextValue) {
      return;
    }

    const next =
      new Date(value);

    if (mode === 'date') {
      const [
        year,
        month,
        day,
      ] =
        nextValue
          .split('-')
          .map(Number);

      next.setFullYear(
        year,
        month - 1,
        day
      );
    } else {
      const [
        hour,
        minute,
      ] =
        nextValue
          .split(':')
          .map(Number);

      next.setHours(
        hour,
        minute,
        0,
        0
      );
    }

    onChange(next);
  }

  return (
    <div
      className="sheet-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="picker-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="picker-sheet-header">
          <div className="picker-sheet-title">
            {title}
          </div>

          <button
            type="button"
            className="picker-sheet-close"
            onClick={onClose}
          >
            DONE
          </button>
        </div>

        <input
          className="native-picker"
          type={mode}
          value={inputValue}
          onChange={(event) =>
            handleValueChange(
              event.target.value
            )
          }
        />
      </div>
    </div>
  );
}


