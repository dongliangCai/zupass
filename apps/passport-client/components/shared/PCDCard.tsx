import { PCD } from "@pcd/pcd-types";
import React, { useCallback, useContext, useMemo } from "react";
import styled from "styled-components";
import { appConfig } from "../../src/appConfig";
import { usePCDCollection, useSelf } from "../../src/appHooks";
import { StateContext } from "../../src/dispatch";
import { usePackage } from "../../src/usePackage";
import { getVisitorStatus, VisitorStatus } from "../../src/user";
import { Button, H4, Spacer, TextCenter } from "../core";
import { MainIdentityCard } from "./MainIdentityCard";

export const PCDCard = React.memo(PCDCardImpl);

/**
 * Shows a card in the Passport wallet. If expanded, the full card, otherwise
 * just the top of the card to allow stacking.
 */
function PCDCardImpl({
  isMainIdentity,
  pcd,
  expanded,
  onClick,
  hideRemoveButton
}: {
  pcd: PCD;
  expanded?: boolean;
  isMainIdentity?: boolean;
  onClick?: (id: string) => void;
  hideRemoveButton?: boolean;
}) {
  const clickHandler = useCallback(() => {
    onClick(pcd.id);
  }, [onClick, pcd.id]);

  if (expanded) {
    return (
      <CardContainerExpanded>
        <CardOutlineExpanded>
          <CardHeader>
            <HeaderContent pcd={pcd} isMainIdentity={isMainIdentity} />
          </CardHeader>
          <CardBodyContainer>
            <CardBody pcd={pcd} isMainIdentity={isMainIdentity} />
            {!hideRemoveButton && (
              <CardFooter pcd={pcd} isMainIdentity={isMainIdentity} />
            )}
          </CardBodyContainer>
        </CardOutlineExpanded>
      </CardContainerExpanded>
    );
  }

  return (
    <CardContainerCollapsed onClick={clickHandler}>
      <CardOutlineCollapsed>
        <CardHeaderCollapsed>
          <HeaderContent pcd={pcd} isMainIdentity={isMainIdentity} />
        </CardHeaderCollapsed>
      </CardOutlineCollapsed>
    </CardContainerCollapsed>
  );
}

function HeaderContent({
  pcd,
  isMainIdentity
}: {
  pcd: PCD;
  isMainIdentity: boolean;
}) {
  const self = useSelf();
  const pcdPackage = usePackage(pcd);

  const displayOptions = useMemo(() => {
    if (pcdPackage?.getDisplayOptions) {
      return pcdPackage?.getDisplayOptions(pcd);
    }
  }, [pcd, pcdPackage]);

  let header;
  if (isMainIdentity && !appConfig.isZuzalu) {
    header = "PCDPASS IDENTITY";
  } else if (isMainIdentity) {
    const visitorStatus = getVisitorStatus(self);

    if (
      visitorStatus.isVisitor &&
      visitorStatus.status === VisitorStatus.Expired
    ) {
      header = "EXPIRED";
    } else if (
      visitorStatus.isVisitor &&
      visitorStatus.status === VisitorStatus.Upcoming
    ) {
      header = "UPCOMING";
    } else {
      header = "VERIFIED ZUZALU PASSPORT";
    }
  } else if (displayOptions?.header) {
    header = displayOptions.header.toUpperCase();
  }

  const headerContent = header ? (
    <>{header}</>
  ) : (
    pcdPackage?.renderCardBody({ pcd, returnHeader: true })
  );

  return headerContent;
}

const CardFooter = React.memo(CardFooterImpl);

function CardFooterImpl({
  pcd,
  isMainIdentity
}: {
  pcd: PCD;
  isMainIdentity: boolean;
}) {
  const { dispatch } = useContext(StateContext);

  const onRemoveClick = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to remove this PCD? It will be permanently deleted!"
      )
    ) {
      dispatch({ type: "remove-pcd", id: pcd.id });
    }
  }, [pcd, dispatch]);

  if (isMainIdentity) {
    return null;
  }

  return (
    <FooterContainer>
      <Button style="danger" size="small" onClick={onRemoveClick}>
        Remove
      </Button>
    </FooterContainer>
  );
}

function CardBody({
  pcd,
  isMainIdentity
}: {
  pcd: PCD;
  isMainIdentity: boolean;
}) {
  const pcdCollection = usePCDCollection();

  if (isMainIdentity) {
    return <MainIdentityCard showQrCode={appConfig.isZuzalu} />;
  }

  if (pcdCollection.hasPackage(pcd.type)) {
    const pcdPackage = pcdCollection.getPackage(pcd.type);
    if (pcdPackage.renderCardBody) {
      const Component = pcdPackage.renderCardBody;
      return <Component pcd={pcd} />;
    }
  }

  return (
    <>
      <TextCenter>
        {pcd.type} unsupported <br />
        no implementation of a ui for this type of card found
      </TextCenter>
      <Spacer h={16} />
    </>
  );
}

export const CardContainerExpanded = styled.div`
  width: 100%;
  padding: 0 8px;
`;

const CardContainerCollapsed = styled(CardContainerExpanded)`
  cursor: pointer;
  padding: 12px 8px;
`;

export const CardOutlineExpanded = styled.div`
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--accent-dark);
  background: var(--primary-dark);
  overflow: hidden;
`;

const CardOutlineCollapsed = styled.div`
  width: 100%;
  border-radius: 12px 12px 0 0;
  border: 1px solid var(--primary-lite);
  color: var(--primary-lite);
  border-bottom: none;

  :hover {
    opacity: 0.9;
  }
`;

const CardHeaderCollapsed = styled.div`
  user-select: none;
  text-align: center;
  font-size: 16px;
  padding: 8px;
`;

export const CardHeader = styled(H4)`
  text-align: center;
  padding: 10px;
`;

const FooterContainer = styled.div`
  padding: 0px 16px 16px 16px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

export const CardBodyContainer = styled.div`
  background-color: white;
  color: var(--bg-dark-primary);
`;
