import { HomePage } from "../../src/samples/pages";
import { PageRoute } from "./PageRoute";

export const metadata = { title: "Home" };

export default function Page() {
  return <PageRoute page={HomePage} />;
}
