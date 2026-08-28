'use client';

import { useRouter } from 'next/navigation';
import LoginPageClient from '../../(public)/login/LoginPageClient';

type LoginModalShellProps = {
  nextPath?: string | null;
};

export default function LoginModalShell({ nextPath }: LoginModalShellProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-8" onClick={handleClose}>
      <div className="relative w-full max-w-md" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-100"
          aria-label="Close sign in modal"
        >
          Close
        </button>
        <LoginPageClient variant="modal" nextPath={nextPath} />
      </div>
    </div>
  );
}