import { ServicesPage } from "../../../src/samples/pages";
import { PageRoute } from "../PageRoute";

export const metadata = { title: "Services" };

export default function Page() {
  return <PageRoute page={ServicesPage} title="Services" />;
}
