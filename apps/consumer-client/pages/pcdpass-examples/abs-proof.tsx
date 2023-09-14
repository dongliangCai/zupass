import {
  openABSSignaturePopup,
  useABSSignatureProof,
  usePCDMultiplexer,
  usePassportPopupMessages,
  usePendingPCD,
} from "@pcd/passport-interface";
import { useCallback, useState } from "react";
import { CollapsableCode, HomeLink } from "../../components/Core";
import { ExampleContainer } from "../../components/ExamplePage";
import { PendingPCDStatusDisplay } from "../../components/PendingPCDStatusDisplay";
import { PCDPASS_SERVER_URL, PCDPASS_URL } from "../../src/constants";

/**
 * Example page which shows how to use a Zuzalu-specific prove screen to
 * request a Semaphore Signature PCD as a third party developer.
 */
export default function Page() {
  // Populate PCD from either client-side or server-side proving using passport popup
  const [passportPCDStr, passportPendingPCDStr] = usePassportPopupMessages();
  const [pendingPCDStatus, pendingPCDError, serverPCDStr] = usePendingPCD(
    passportPendingPCDStr,
    PCDPASS_SERVER_URL
  );
  const pcdStr = usePCDMultiplexer(passportPCDStr, serverPCDStr);

  const [signatureProofValid, setSignatureProofValid] = useState<
    boolean | undefined
  >();
  const onProofVerified = (valid: boolean) => {
    setSignatureProofValid(valid);
  };

  const [policy, setPolicy] = useState<string>("");
  
  const { signatureProof } = useABSSignatureProof(
    pcdStr,
    onProofVerified
  );

  // const [serverProving, setServerProving] = useState(false);

  return (
    <>
      <HomeLink />
      <h2>PCDPass Attribute-Based Signature Proof</h2>
      <p>
        This page shows a working example of an integration with PCDPass which
        requests and verifies a attribute-based signature from a holder of PCDPass.
      </p>
      <ExampleContainer>
        <label>Policy verifier requires: (CompanyA OR CompanyB) AND (Age&gt;18 AND Salary&gt;3000)</label><br></br>
        <label>Attributes user own: Age&gt;18 Salary&gt;3000 CompanyA</label><br></br><br/>
        <label>Pick up your policy to sign:</label><br></br>
        <label>
          <input
            placeholder="AGE&lt;18"
            type="text"
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
          />
        </label>

        <br/><br/>
        <button
          disabled={signatureProofValid}
          onClick={useCallback(
            () =>
                openABSSignaturePopup(
                PCDPASS_URL,
                window.location.origin + "/popup",
                "test",
                policy,
                "Age>18 Salary>3000 CompanyA",
                false
              ),
            [policy]
          )}
        >
          Request Attribute-Based Signature
        </button>
        {/* <label>
          <input
            type="checkbox"
            checked={serverProving}
            onChange={() => {
              setServerProving((checked: boolean) => !checked);
            }}
          />
          server-side proof
        </label> */}
        {passportPendingPCDStr && (
          <>
            <PendingPCDStatusDisplay
              status={pendingPCDStatus}
              pendingPCDError={pendingPCDError}
            />
          </>
        )}
        {signatureProof != null && (
          <>
            <p>Got Semaphore Signature Proof from PCDPass</p>

            <p>{`Message signed: ${signatureProof.claim.signedMessage}`}</p>
            {signatureProofValid === undefined && <p>❓ Proof verifying</p>}
            {signatureProofValid === false && <p>❌ Proof is invalid</p>}
            {signatureProofValid === true && <p>✅ Proof is valid</p>}
            <CollapsableCode
              label="PCD Response"
              code={
                JSON.stringify(signatureProof, function replacer(key, value) {
                  if (key === "verifyServer") return undefined 
                  else return value
                }, 2)
              }
            />
          </>
        )}

        {signatureProofValid === true && (
          <>
            {<p>❌ Invalid proof example</p>}
            <CollapsableCode
              label="PCD Response"
              code={
                JSON.stringify(signatureProof, function replacer(key, value) {
                  if (key === "verifyServer") return undefined 
                  if (key === "policy") return "Salary<3000"
                  else return value
                }, 2)
              }
            />
          </>
        )}
      </ExampleContainer>
    </>
  );
}
