import { JsonLd } from './json-ld';
import ToolClient from './tool-client';

export default function Home() {
  return (
    <>
      <ToolClient />
      <JsonLd />
    </>
  );
}
