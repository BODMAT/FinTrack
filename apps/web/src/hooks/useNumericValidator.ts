import { useState, useCallback } from "react";

type NumericValidationError =
  | "Field must be a number!"
  | `Field must be at least ${number}`
  | `Field must be at most ${number}`
  | null;

export const useNumericValidator = () => {
  const [formError, setFormError] = useState<NumericValidationError>(null);

  const validateNumericInput = useCallback(
    (prev: string, next: string, min?: number, max?: number): string => {
      if (next === "") {
        setFormError(null);
        return next;
      }

      const numericRegex = /^-?\d*\.?\d*$/;

      if (!numericRegex.test(next)) {
        setFormError("Field must be a number!");
        return prev;
      }

      if (next === "-") {
        if (min !== undefined && min >= 0) {
          setFormError(`Field must be at least ${min}`);
          return prev;
        }
        setFormError(null);
        return next;
      }

      const parsedValue = parseFloat(next);

      if (min !== undefined && parsedValue < min) {
        setFormError(`Field must be at least ${min}`);
        return prev;
      }

      if (max !== undefined && parsedValue > max) {
        setFormError(`Field must be at most ${max}`);
        return prev;
      }

      setFormError(null);
      return next;
    },
    [],
  );

  return {
    formError,
    setFormError,
    validateNumericInput,
  };
};
