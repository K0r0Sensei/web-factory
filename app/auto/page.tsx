import { GeneratedSite } from '../../src/engine/renderer';
import { exampleBusiness } from '../../src/data/example-business';
import { chooseDesign } from '../../src/engine/design-director';

export default function AutoPage() {
  const design = chooseDesign(exampleBusiness);
  return <GeneratedSite business={exampleBusiness} design={design} />;
}
