import { ContactPage } from "../../../src/samples/pages";
import { PageRoute } from "../PageRoute";

export const metadata = { title: "Contact" };

export default function Page() {
  return <PageRoute page={ContactPage} title="Contact" />;
}
