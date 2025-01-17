import styled from "styled-components";
import { RSAImagePCD } from "./RSAImagePCD";

export function RSAImageCardBody({ pcd }: { pcd: RSAImagePCD }) {
  const imageData = JSON.parse(pcd.proof.rsaPCD.claim.message);

  return (
    <Container>
      <img src={imageData.url} />
    </Container>
  );
}

const Container = styled.span`
  padding: 16px;
  overflow: hidden;
  width: 100%;

  img {
    max-width: 100%;
  }
`;
