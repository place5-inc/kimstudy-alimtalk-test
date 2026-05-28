export interface ResultState {
  ok: boolean;
  message: string;
}

export function ResultBox({ result }: { result: ResultState | null }) {
  if (!result) return null;
  return (
    <div
      className={`result-box ${result.ok ? 'result-success' : 'result-error'}`}
      role="status"
      aria-live="polite"
    >
      {result.message}
    </div>
  );
}
