/**
 * All PCDs consist of a "claim", which is the human-interpretable statement
 * that the PCD is making (i.e. "I am a Zuzalu resident"); and a "proof" attached
 * to the "claim," which is a cryptographic or mathematical proof of the claim.
 * A PCD consists of only data. The code and algorithms associated with each type
 * of PCD lives in that PCD type's corresponding {@link PCDPackage}. The package
 * exposes, among other things, `prove` and `verify` functions, which allow you to
 * create new instances of the PCD and, and verify that instances of the PCD are
 * indeed correct respectively.
 */
export interface PCD<C = unknown, P = unknown> {
  /**
   * Uniquely identifies this instance. PCDpass cannot have more than one
   * {@link PCD} with the same id. In practice this is often a UUID generated
   * by the {@link PCDPackage#prove} function.
   */
  id: string;

  /**
   * Refers to {@link PCDPackage#name} - each {@link PCD} must come from a
   * particular {@link PCDPackage}. By convention, this is a string like
   * `'semaphore-identity-pcd'`, or `'rsa-ticket-pcd'`. These type names
   * are intended to be globally unique - i.e. no two distinct PCD types
   * should have the same type name.
   */
  type: string;

  /**
   * Information encoded in this PCD that is intended to be consumed by the
   * business logic of some application. For example, a type of PCD that could
   * exist is one that is able to prove that its creator knows the prime factorization
   * of a really big number. In that case, the really big number would be the claim,
   * and a ZK proof of its prime factorization would go in the {@link PCD#proof}.
   *
   */
  claim: C;

  /**
   * A cryptographic or mathematical proof of the {@link PCD#claim}.
   */
  proof: P;
}

/**
 * Each type of {@link PCD} has a corresponding {@link PCDPackage}. The
 * {@link PCDPackage} of a {@link PCD} type defines the code necessary to
 * derive meaning from and operate on the data within a {@link PCD}.
 *
 * @typeParam {@link C} the type of {@link PCD.claim} for the {@link PCD} encapsulated
 *   by this {@link PCDPackage}
 *
 * @typeParam {@link P} the type of {@link PCD.proof} for the {@link PCD} encapsulated
 *   by this {@link PCDPackage}
 *
 * @typeParam {@link A} - the type of the arguments passed into {@link PCDPackage#prove}
 *   to instantiate a new {@link PCD}. It is important that {@link A} can be serialized
 *   and deserialized using {@code JSON.stringify} {@code JSON.parse}, because these arguments
 *   should be able to be passed over the wire trivially. This may cause the type of {@link A}
 *   to be less convenient that desired. Eg. you may have to pass {@code BigInt}s in as strings,
 *   etc. Another important note about {@link A} is that each of its fields must implement the
 *   {@link Argument} interface. This is important because it enables PCDpass to introspect the
 *   arguments, and to implement useful features like the {@code GenericProveScreen}, which is
 *   a screen that automatically builds a UI which lets a user input all the arguments required to
 *   instantiate a new instance of a particular {@link PCD} based on the request it gets from a
 *   third party.
 *
 * @typeparam {@link I} the type of the arguments passed into {@link PCDPackage#init}, if the
 *   init function is present to instantiate a new {@link PCD}
 */
export interface PCDPackage<C = any, P = any, A = any, I = any> {
  /**
   * The unique name identifying the type of {@link PCD} this package encapsulates.
   */
  name: string;

  /**
   * Intended for use by PCDpass. Given a {@link PCD}, returns some information about
   * how this {@link PCD} should be displayed to the user within the passport app.
   */
  getDisplayOptions?: (pcd: PCD<C, P>) => DisplayOptions;

  /**
   * Intended to be used by PCDpass. Given a {@link PCD}, renders the body of a card
   * that appears in PCDpass representing this {@link PCD}.
   *
   * If the {@link DisplayOptions#header} returned by {@link PCDPackage#getDisplayOptions}
   * is undefined, PCDpass will call this function with the `returnHeader` field set to true,
   * and use the result as the header of the card.
   */
  renderCardBody?: ({
    pcd,
    returnHeader
  }: {
    pcd: PCD<C, P>;
    returnHeader?: boolean;
  }) => React.ReactElement;

  /**
   * Initializes this {@link PCDPackage} so that it can be used in the current context.
   * This is an optional field, because not all packages need to be initialized.
   */
  init?: (initArgs: I) => Promise<void>;

  /**
   * This is effectively a factory for instances of the {@link PCD} that this {@link PCDPackage}
   * encapsulates. It generates a proof and derives a claim from the args, and returns a
   * new PCD instance.
   */
  prove(args: A): Promise<PCD<C, P>>;

  /**
   * This function lets consumers of the {@link PCD} encapsulated by this {@link PCDPackage}
   * verify whether the {@link PCD}'s {@link PCD#claim} corresponds correctly to its
   * {@link PCD#proof}.
   */
  verify(pcd: PCD<C, P>): Promise<boolean>;

  /**
   * Serializes an instance of this package's {@link PCD} so that it can be stored on disk
   * or sent over a network.
   *
   * More concretely, this function returns a promise of `SerializedPCD<PCD<C, P>>`
   * and {@link PCDPackage.deserialize} takes `SerializedPCD<PCD<C, P>>.pcd` as a parameter
   * and returns an instance of PCD<C, P>.
   */
  serialize(pcd: PCD<C, P>): Promise<SerializedPCD<PCD<C, P>>>;

  /**
   * Sibling method to {@link PCDPackage.serialize} - converts {@link SerializedPCD.pcd} back
   * into an instance of this package's {@link PCD} type.
   */
  deserialize(seralized: string): Promise<PCD<C, P>>;
}

/**
 * The input and output of a {@link PCDPackage}'s {@link PCDPackage.serialize} and
 * {@link PCDPackage.deserialize} methods.
 */
export interface SerializedPCD<_T extends PCD = PCD> {
  type: string;
  pcd: string;
}

/**
 * Given a type extending {@link PCDPackage}, extracts the type of the parameter of its
 * {@link PCDPackage.prove} function.
 */
export type ArgsOf<T> = T extends PCDPackage<any, any, infer U, any> ? U : T;

/**
 * Given a type extending {@link PCDPackage}, extracts the type of {@link PCD} it
 * encapsulates.
 */
export type PCDOf<T> = T extends PCDPackage<infer C, infer P, any, any>
  ? PCD<C, P>
  : T;

/**
 * This interface can be optionally returned by the package for any given
 * PCD, which allows the package some degree of control over how the PCD
 * is displayed in the passport application.
 */
export interface DisplayOptions {
  /**
   * Shown to the user in the main page of the passport, where they can
   * see all of their cards. If `header` is undefined, the passport will use
   * `renderCardBody` with `returnHeader` set to true.
   */
  header?: string;

  /**
   * Shown to the user in the `GenericProveScreen`, allowing them to
   * disambiguate between different pcds of the same type. In the future,
   * we'll have a better way to disambiguate between them.
   */
  displayName?: string;
}

export type PCDTypeNameOf<T> = T extends PCDPackage<any, any, any, any>
  ? T["name"]
  : T;
export interface ArgumentType<T extends ArgumentTypeName, U = unknown> {
  type: T;
  specificType: U;
}

export interface Argument<
  TypeName extends ArgumentTypeName,
  ValueType = unknown
> {
  argumentType: TypeName;
  value?: ValueType;
  remoteUrl?: string;
  userProvided?: boolean;
  description?: string;
}

/**
 * Fields of the object passed into {@link PCDPackage.prove} can only represent
 * one of the following types. {@link Unknown} is included to be used in a similar
 * way as {@code unknown} is used in TypeScript.
 */
export enum ArgumentTypeName {
  String = "String",
  Number = "Number",
  BigInt = "BigInt",
  Boolean = "Boolean",
  Object = "Object",
  StringArray = "StringArray",
  PCD = "PCD",
  Unknown = "Unknown"
}

export type StringArgument = Argument<ArgumentTypeName.String, string>;
export function isStringArgument(
  arg: Argument<any, unknown>
): arg is StringArgument {
  return arg.argumentType === ArgumentTypeName.String;
}

export type NumberArgument = Argument<ArgumentTypeName.Number, string>;
export function isNumberArgument(
  arg: Argument<any, unknown>
): arg is NumberArgument {
  return arg.argumentType === ArgumentTypeName.Number;
}

export type BigIntArgument = Argument<ArgumentTypeName.BigInt, string>;
export function isBigIntArgument(
  arg: Argument<any, unknown>
): arg is BigIntArgument {
  return arg.argumentType === ArgumentTypeName.BigInt;
}

export type BooleanArgument = Argument<ArgumentTypeName.Boolean, boolean>;
export function isBooleanArgument(
  arg: Argument<any, unknown>
): arg is BooleanArgument {
  return arg.argumentType === ArgumentTypeName.Boolean;
}

export type ObjectArgument<T> = Argument<ArgumentTypeName.Object, T>;
export function isObjectArgument(
  arg: Argument<any, unknown>
): arg is ObjectArgument<unknown> {
  return arg.argumentType === ArgumentTypeName.Object;
}

export type StringArrayArgument = Argument<
  ArgumentTypeName.StringArray,
  string[]
>;
export function isStringArrayArgument(
  arg: Argument<any, unknown>
): arg is StringArrayArgument {
  return arg.argumentType === ArgumentTypeName.StringArray;
}

export type PCDArgument<T extends PCD = PCD> = Argument<
  ArgumentTypeName.PCD,
  SerializedPCD<T>
> & {
  pcdType?: string;
};
export function isPCDArgument(arg: Argument<any, unknown>): arg is PCDArgument {
  return arg.argumentType === ArgumentTypeName.PCD;
}
