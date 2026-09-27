import { TeamPage } from "../../../src/samples/pages";
import { PageRoute } from "../PageRoute";

export const metadata = { title: "Team" };

export default function Page() {
  return <PageRoute page={TeamPage} title="Team" />;
}
