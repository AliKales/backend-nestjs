export type DateUnit = 'second' | 'minute' | 'hour' | 'day';

/**
 * Modifies a Date by adding or subtracting a specific amount of time.
 * Use a positive number to add, and a negative number to subtract.
 */
export function modifyDate(date: Date, amount: number, unit: DateUnit): Date {
    const multipliers: Record<DateUnit, number> = {
        second: 1000,
        minute: 60 * 1000,
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
    };

    return new Date(date.getTime() + amount * multipliers[unit]);
}