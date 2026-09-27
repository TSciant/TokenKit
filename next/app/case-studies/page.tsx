import { CaseStudiesPage } from "../../../src/samples/pages";
import { PageRoute } from "../PageRoute";

export const metadata = { title: "Case studies" };

export default function Page() {
  return <PageRoute page={CaseStudiesPage} title="Case studies" />;
}
