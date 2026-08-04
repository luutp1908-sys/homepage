type TestingSlugPageProps = {
  params: Promise<{ testingslug: string }>;
};

const TestingSlug = async ({ params }: TestingSlugPageProps) => {
  const { testingslug } = await params;

  return <h1>This is my testing component {testingslug}</h1>;
};

export default TestingSlug