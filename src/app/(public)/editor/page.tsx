import EmbeddedEditorHost from './EmbeddedEditorHost';

export const metadata = {
  title: 'Editor',
  description: 'Embedded editor host route',
};

export default function PublicEditorPage() {
  return <EmbeddedEditorHost />;
}
