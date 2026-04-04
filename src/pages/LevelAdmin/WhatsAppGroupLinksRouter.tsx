import { useParams } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import AssemblyWhatsAppGroupLinks from "./assemblyLevel/WhatsAppGroupLinks";
import SubLevelWhatsAppGroupLinks from "./subLevel/WhatsAppGroupLinks";

export function WhatsAppGroupLinksRouter() {
  const { levelId } = useParams<{ levelId: string }>();
  const { levelAdminPanels } = useAppSelector((state) => state.auth);
  const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

  if (currentPanel?.name === "Assembly") {
    return <AssemblyWhatsAppGroupLinks />;
  }

  // Block, Mandal, Sector, Zone, Ward, PollingCenter, Booth etc.
  return <SubLevelWhatsAppGroupLinks />;
}
