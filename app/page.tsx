import { GeneratedSite } from '../src/engine/renderer';
import { exampleBusiness, exampleDesign } from '../src/data/example-business';

export default function Home() {
  return <GeneratedSite business={exampleBusiness} design={exampleDesign} />;
}
