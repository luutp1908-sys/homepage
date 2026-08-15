type ErrorAlertProps = {
  message: string;
};

export default function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">{message}</div>
  );
}
