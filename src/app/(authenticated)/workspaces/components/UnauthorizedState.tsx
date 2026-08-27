import Link from 'next/link';

export default function UnauthorizedState() {
  return (
    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 text-amber-800 shadow-sm">
      <p className="text-sm">You need to sign in to view your workspaces.</p>
      <Link href="/login" className="mt-3 inline-flex rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Go to Sign in
      </Link>
    </div>
  );
}
