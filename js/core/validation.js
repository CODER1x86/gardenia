/**
 * Validation utilities
 * Handles form validation and data verification
 */
import { VALIDATION_RULES, ERROR_MESSAGES } from '../config/constants.js';

class Validation {
    constructor() {
        this.rules = VALIDATION_RULES;
        this.customRules = new Map();
    }

    // Add custom validation rule
    addRule(name, validator) {
        this.customRules.set(name, validator);
    }

    // Validate a single value
    validate(value, rules) {
        const errors = [];

        if (rules.required && !value) {
            errors.push(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD);
        }

        if (value) {
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`Minimum length is ${rules.minLength} characters`);
            }

            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`Maximum length is ${rules.maxLength} characters`);
            }

            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(rules.patternMessage || ERROR_MESSAGES.VALIDATION.INVALID_FORMAT);
            }

            if (rules.min !== undefined && Number(value) < rules.min) {
                errors.push(`Minimum value is ${rules.min}`);
            }

            if (rules.max !== undefined && Number(value) > rules.max) {
                errors.push(`Maximum value is ${rules.max}`);
            }

            if (rules.custom) {
                const customValidator = this.customRules.get(rules.custom);
                if (customValidator) {
                    const result = customValidator(value);
                    if (result !== true) {
                        errors.push(result);
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate an entire form
    validateForm(formData, schema) {
        const errors = {};
        let isValid = true;

        Object.entries(schema).forEach(([field, rules]) => {
            const value = formData[field];
            const validation = this.validate(value, rules);
            
            if (!validation.isValid) {
                errors[field] = validation.errors;
                isValid = false;
            }
        });

        return {
            isValid,
            errors
        };
    }

    // Predefined validators
    validators = {
        username: (value) => {
            return this.validate(value, {
                required: true,
                minLength: this.rules.USERNAME.MIN_LENGTH,
                maxLength: this.rules.USERNAME.MAX_LENGTH,
                pattern: this.rules.USERNAME.PATTERN,
                patternMessage: 'Username can only contain letters, numbers, and underscores'
            });
        },

        password: (value) => {
            const rules = this.rules.PASSWORD;
            const errors = [];

            if (value.length < rules.MIN_LENGTH) {
                errors.push(`Password must be at least ${rules.MIN_LENGTH} characters long`);
            }

            if (rules.REQUIRE_UPPERCASE && !/[A-Z]/.test(value)) {
                errors.push('Password must contain at least one uppercase letter');
            }

            if (rules.REQUIRE_LOWERCASE && !/[a-z]/.test(value)) {
                errors.push('Password must contain at least one lowercase letter');
            }

            if (rules.REQUIRE_NUMBER && !/\d/.test(value)) {
                errors.push('Password must contain at least one number');
            }

            if (rules.REQUIRE_SPECIAL && !/[!@#$%^&*]/.test(value)) {
                errors.push('Password must contain at least one special character (!@#$%^&*)');
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        },

        amount: (value) => {
            return this.validate(value, {
                required: true,
                min: this.rules.AMOUNT.MIN,
                max: this.rules.AMOUNT.MAX,
                pattern: /^\d+(\.\d{1,2})?$/,
                patternMessage: 'Amount must be a valid number with up to 2 decimal places'
            });
        },

        email: (value) => {
            return this.validate(value, {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                patternMessage: 'Please enter a valid email address'
            });
        },

        phone: (value) => {
            return this.validate(value, {
                required: true,
                pattern: /^(\+?63|0)?[0-9]{10}$/,
                patternMessage: 'Please enter a valid Philippine phone number'
            });
        },

        date: (value) => {
            const date = new Date(value);
            return {
                isValid: !isNaN(date.getTime()),
                errors: isNaN(date.getTime()) ? ['Please enter a valid date'] : []
            };
        }
    };

    // Form field validation
    attachFieldValidation(input, rules) {
        input.addEventListener('input', () => {
            const result = this.validate(input.value, rules);
            this.updateFieldValidation(input, result);
        });

        input.addEventListener('blur', () => {
            const result = this.validate(input.value, rules);
            this.updateFieldValidation(input, result);
        });
    }

    // Update field validation UI
    updateFieldValidation(input, result) {
        const container = input.parentElement;
        const errorElement = container.querySelector('.error-message') 
            || document.createElement('div');
        
        errorElement.className = 'error-message';
        
        if (!result.isValid) {
            input.classList.add('invalid');
            errorElement.textContent = result.errors[0];
            if (!container.contains(errorElement)) {
                container.appendChild(errorElement);
            }
        } else {
            input.classList.remove('invalid');
            errorElement.remove();
        }
    }
}

export default new Validation();