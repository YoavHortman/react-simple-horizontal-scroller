import { AssertionError } from 'assert';


/**
 * Returns true if the given JSX element matches the given component type.
 *
 * NOTE: This function only checks equality of `displayName` for performance and
 * to tolerate multiple minor versions of a component being included in one
 * application bundle.
 * @param element JSX element in question
 * @param ComponentType desired component type of element
 */
export function isElementOfType<P = {}>(
  element: any,
  ComponentType: React.ComponentType<P>,
): element is React.ReactElement<P> {
  return (
    element != null &&
    element.type != null &&
    element.type.displayName != null &&
    element.type.displayName === ComponentType.displayName
  );
}

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  assert(val !== undefined && val !== null, `Expected 'val' to be defined, but received ${val}`);
}

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new AssertionError({ message: msg });
  }
}
export function assertNever(val: never) {
  return val;
}