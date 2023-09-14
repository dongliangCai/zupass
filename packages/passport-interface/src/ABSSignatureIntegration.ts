import { ABSSignaturePCDPackage } from "@pcd/abs-pcd";
import { ArgumentTypeName } from "@pcd/pcd-types";
import { SemaphoreIdentityPCDPackage } from "@pcd/semaphore-identity-pcd";
import { useEffect } from "react";
import { constructPassportPcdGetRequestUrl } from "./PassportInterface";
import { openPassportPopup } from "./PassportPopup";
import { useSerializedPCD } from "./SerializedPCDIntegration";

/**
 * Opens a passport popup to generate a Semaphore signature proof.
 *
 * @param urlToPassportWebsite URL of passport website
 * @param popupUrl Route where the usePassportPopupSetup hook is being served from
 * @param messageToSign Message being attested to
 * @param proveOnServer Boolean indicating whether proof should be generated on server
 */
export function openABSSignaturePopup(
  urlToPassportWebsite: string,
  popupUrl: string,
  messageToSign: string,
  attriblist: string[],
  proveOnServer?: boolean
) {
  const proofUrl = constructPassportPcdGetRequestUrl<
    typeof ABSSignaturePCDPackage
  >(
    urlToPassportWebsite,
    popupUrl,
    ABSSignaturePCDPackage.name,
    {
      identity: {
        argumentType: ArgumentTypeName.PCD,
        pcdType: SemaphoreIdentityPCDPackage.name,
        value: undefined,
        userProvided: true,
      },
      attriblist: attriblist,
      signedMessage: {
        argumentType: ArgumentTypeName.String,
        value: messageToSign,
        userProvided: false,
      },
    },
    {
      proveOnServer: proveOnServer,
    }
  );

  openPassportPopup(popupUrl, proofUrl);
}

/**
 * React hook which can be used on 3rd party application websites that
 * parses and verifies a PCD representing a Semaphore signature proof.
 */
export function useABSSignatureProof(
  pcdStr: string,
  onVerified: (valid: boolean) => void
) {
  const semaphoreSignaturePCD = useSerializedPCD(
    ABSSignaturePCDPackage,
    pcdStr
  );

  useEffect(() => {
    if (semaphoreSignaturePCD) {
      const { verify } = ABSSignaturePCDPackage;
      verify(semaphoreSignaturePCD).then(onVerified);
    }
  }, [semaphoreSignaturePCD, onVerified]);

  return {
    signatureProof: semaphoreSignaturePCD,
  };
}
