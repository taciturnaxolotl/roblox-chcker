/**
 * Gives a pseudo-random number between min and max (inclusive)
 * @param min The minimum value
 * @param max The maximum value
 * @returns A random integer between the minimum and maximum
 */
export const genRandom = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
