import { useAppSelector } from "../store/hooks";
import StateAssemblyListing from "./State/assembly";
import DistrictAssembly from "./District/assembly/Assembly";

export default function DynamicAssembly() {
  const levelType = useAppSelector((s) => s.auth.selectedAssignment?.levelType);
  if (levelType === "District") return <DistrictAssembly />;
  return <StateAssemblyListing />;
}
