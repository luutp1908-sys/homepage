type TestingLayoutProps = {
  children: React.ReactNode;
};

const TestingLayout = ({ children }: TestingLayoutProps) => {
  return (
    <div>
      <h2>Here is a content from the testing layout</h2>
      {children}
    </div>
  );
};

export default TestingLayout