import { useAppSelector } from "../store/hooks";
import StateMarkedVotersPage from "./State/marker_voter/StateMarkedVotersPage";
import AssemblyListPage from "./District/mark_voter/AssemblyListPage";

export default function DynamicMarkedVoters() {
  const levelType = useAppSelector((s) => s.auth.selectedAssignment?.levelType);
  if (levelType === "District") return <AssemblyListPage />;
  return <StateMarkedVotersPage />;
}
