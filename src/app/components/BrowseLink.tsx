type BrowseLinkProps = {
  className?: string;
  children: React.ReactNode;
};

export default function BrowseLink({ className, children }: BrowseLinkProps) {
  return (
    <a href="/" className={className}>
      {children}
    </a>
  );
}
