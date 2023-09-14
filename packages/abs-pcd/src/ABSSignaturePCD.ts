import {
  DisplayOptions,
  PCD,
  PCDArgument,
  PCDPackage,
  SerializedPCD,
  StringArgument,
} from "@pcd/pcd-types";
import {
  SemaphoreIdentityPCD,
  SemaphoreIdentityPCDPackage,
} from "@pcd/semaphore-identity-pcd";
import { sha256 } from "js-sha256";
import JSONBig from "json-bigint";
import { v4 as uuid } from "uuid";
import { requestGenerateattributes, requestverify } from "./Api";
import { ABSIdentityCardBody } from "./CardBody";

/**
 * All signature PCDs are 'namespaced' to this pseudo-random nullifier,
 * so that they cannot be reused by malicious actors across different
 * applications.
 */
export const STATIC_SIGNATURE_PCD_NULLIFIER = generateMessageHash(
  "hardcoded-nullifier"
);

/**
 * Hashes a message to be signed with sha256 and fits it into a baby jub jub field element.
 * @param signal The initial message.
 * @returns The outputted hash, fed in as a signal to the Semaphore proof.
 */
export function generateMessageHash(signal: string): bigint {
  // right shift to fit into a field element, which is 254 bits long
  // shift by 8 ensures we have a 253 bit element
  return BigInt("0x" + sha256(signal)) >> BigInt(8);
}

export const ABSSignaturePCDTypeName = "abs-signature-pcd";

export interface ABSSignaturePCDInitArgs {
  // TODO: how do we distribute these in-package, so that consumers
  // of the package don't have to copy-paste these artifacts?
  // TODO: how do we account for different versions of the same type
  // of artifact? eg. this one is parameterized by group size. Should
  // we pre-generate a bunch of artifacts per possible group size?
  // Should we do code-gen?
  ABSHolder: string;
}

let initArgs: ABSSignaturePCDInitArgs | undefined = undefined;

// We hardcode the externalNullifer to also be your identityCommitment
// so that your nullifier for specific groups is not revealed when
// a SemaphoreSignaturePCD is requested from a consumer application.
export interface ABSSignaturePCDArgs {
  identity: PCDArgument<SemaphoreIdentityPCD>;
  attriblist: string[];
  signedMessage: StringArgument;
}

export interface ABSSignaturePCDClaim {
  /**
   * Pre-hashed message.
   */
  signedMessage: string;

  /**
   * Stringified `BigInt`.
   */
  identityId: string;

  verifyServer: string;
}

export type ABSSignaturePCDProof = string;
export class ABSSignaturePCD
  implements PCD<ABSSignaturePCDClaim, ABSSignaturePCDProof>
{
  type = ABSSignaturePCDTypeName;
  claim: ABSSignaturePCDClaim;
  proof: ABSSignaturePCDProof;
  id: string;

  public constructor(
    id: string,
    claim: ABSSignaturePCDClaim,
    proof: ABSSignaturePCDProof
  ) {
    this.id = id;
    this.claim = claim;
    this.proof = proof;
  }
}

export async function init(args: ABSSignaturePCDInitArgs): Promise<void> {
  initArgs = args;
}

export async function prove(
  args: ABSSignaturePCDArgs
): Promise<ABSSignaturePCD> {
  if (!initArgs) {
    throw new Error(
      "cannot make ABS signature proof: init has not been called yet"
    );
  }

  console.log("22222")

  const serializedIdentityPCD = args.identity.value?.pcd;
  if (!serializedIdentityPCD) {
    throw new Error(
      "cannot make ABS signature proof: identity is not set"
    );
  }
  const identityPCD = await SemaphoreIdentityPCDPackage.deserialize(
    serializedIdentityPCD
  );

  if (args.signedMessage.value === undefined) {
    throw new Error(
      "cannot make semaphore signature proof: signed message is not set"
    );
  }

  console.log("33333")

  const identityId = identityPCD.claim.identity.commitment.toString();
  // requestGenerateattributes
  requestGenerateattributes(initArgs.ABSHolder, identityId, "AGE<18")


  console.log("4444")
  const claim: ABSSignaturePCDClaim = {
    identityId: identityId,
    signedMessage: args.signedMessage.value,
    verifyServer: initArgs.ABSHolder,
  };

  const proof: ABSSignaturePCDProof = "";

  return new ABSSignaturePCD(uuid(), claim, proof);
}

export async function verify(pcd: ABSSignaturePCD): Promise<boolean> {
  // check if proof is valid
  const validProof = await requestverify(pcd.claim.verifyServer, pcd.claim.identityId, "AGE<18");

  return validProof;
}

export async function serialize(
  pcd: ABSSignaturePCD
): Promise<SerializedPCD<ABSSignaturePCD>> {
  return {
    type: ABSSignaturePCDTypeName,
    pcd: JSONBig().stringify(pcd),
  } as SerializedPCD<ABSSignaturePCD>;
}

export async function deserialize(
  serialized: string
): Promise<ABSSignaturePCD> {
  return JSONBig().parse(serialized);
}

export function getDisplayOptions(pcd: ABSSignaturePCD): DisplayOptions {
  return {
    header: "Semaphore Signature",
    displayName: "semaphore-sig-" + pcd.id.substring(0, 4),
  };
}

/**
 * PCD-conforming wrapper to sign messages using one's Semaphore public key. This is a small
 * extension of the existing Semaphore protocol, which is mostly geared at group signatures.
 * Find documentation of Semaphore here: https://semaphore.appliedzkp.org/docs/introduction
 */
export const ABSSignaturePCDPackage: PCDPackage<
ABSSignaturePCDClaim,
ABSSignaturePCDProof,
  ABSSignaturePCDArgs,
  ABSSignaturePCDInitArgs
> = {
  name: ABSSignaturePCDTypeName,
  renderCardBody: ABSIdentityCardBody,
  getDisplayOptions,
  init,
  prove,
  verify,
  serialize,
  deserialize,
};

// passport client > pcds

// web > passport client > pcd::verify()

// web > init() > passport client
// web > prove() > passport client::addPCD();
// web > verify() > passport client::verifyPCD();

// ABS server setup

// docker nginx 

// init > js (ABS server API)
// prove > js (ABS server API)
//       > passport server

// verify > js (ABS server API)

