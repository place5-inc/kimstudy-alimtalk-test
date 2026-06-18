import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { z, type ZodSchema } from "zod";
import { ResultBox, type ResultState } from "./ResultBox";
import { ConfirmModal } from "./ConfirmModal";
import { useToast } from "./Toast";
import {
  callProxy,
  fetchConfirmToken,
  UnauthenticatedError,
} from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { useEnv } from "../config/EnvContext";

export type ActionVariant = "send" | "pending" | "done" | "reset";

const variantClass: Record<ActionVariant, string> = {
  send: "btn-send",
  pending: "btn-pending",
  done: "btn-done",
  reset: "btn-reset",
};

export interface ActionFormProps<T extends Record<string, string>> {
  title: string;
  badge?: string;
  buttonLabel: string;
  variant: ActionVariant;
  schema: ZodSchema<T>;
  backendPath: string;
  buildParams: (values: T) => Record<string, string>;
  action: string;
  dangerous: boolean;
  confirmTitle?: string;
  confirmBody?: string;
  resetAfterSuccess?: boolean;
  children: (api: {
    register: <K extends keyof T>(
      field: K,
    ) => {
      value: string;
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      name: string;
    };
    setField: <K extends keyof T>(field: K, value: string) => void;
    values: Partial<T>;
  }) => ReactNode;
}

export function ActionForm<T extends Record<string, string>>({
  title,
  badge,
  buttonLabel,
  variant,
  schema,
  backendPath,
  buildParams,
  action,
  dangerous,
  confirmTitle,
  confirmBody,
  resetAfterSuccess = true,
  children,
}: ActionFormProps<T>) {
  const [values, setValues] = useState<Partial<T>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { show: showToast } = useToast();
  const { logout } = useAuth();
  const { env } = useEnv();

  const setField = useCallback(<K extends keyof T>(field: K, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const register = useCallback(
    <K extends keyof T>(field: K) => ({
      value: (values[field] as string | undefined) ?? "",
      name: String(field),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setField(field, e.target.value),
    }),
    [values, setField],
  );

  const runAction = useCallback(
    async (validated: T) => {
      setBusy(true);
      setResult(null);
      try {
        let confirmToken: string | undefined;
        if (dangerous) {
          confirmToken = await fetchConfirmToken(action);
        }
        const params = buildParams(validated);
        const r = await callProxy(backendPath, params, { confirmToken, env });
        if (r.ok) {
          setResult({ ok: true, message: `성공 (${r.status}) ${r.body}` });
          if (resetAfterSuccess) setValues({});
        } else {
          setResult({ ok: false, message: `실패 (${r.status}) ${r.body}` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) {
          await logout();
          return;
        }
        setResult({
          ok: false,
          message: `오류: ${e instanceof Error ? e.message : String(e)}`,
        });
      } finally {
        setBusy(false);
        showToast("처리가 완료되었습니다");
      }
    },
    [
      action,
      backendPath,
      buildParams,
      dangerous,
      logout,
      resetAfterSuccess,
      showToast,
    ],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        setResult({
          ok: false,
          message: first?.message ?? "입력값을 확인해주세요.",
        });
        return;
      }
      if (dangerous) {
        setConfirmOpen(true);
        return;
      }
      void runAction(parsed.data);
    },
    [dangerous, runAction, schema, values],
  );

  const onConfirm = useCallback(() => {
    setConfirmOpen(false);
    const parsed = schema.safeParse(values);
    if (parsed.success) void runAction(parsed.data);
  }, [runAction, schema, values]);

  return (
    <form className="section" onSubmit={handleSubmit} noValidate>
      <p className="section-title">
        {title}
        {badge && <span className="badge">{badge}</span>}
      </p>
      {children({ register, setField, values })}
      <button
        type="submit"
        className={`btn ${variantClass[variant]}`}
        disabled={busy}
      >
        {busy ? "처리 중..." : buttonLabel}
      </button>
      <ResultBox result={result} />
      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle ?? "실행하시겠습니까?"}
        body={confirmBody ?? "이 작업은 실제 발송/처리됩니다."}
        confirmLabel="실행"
        onConfirm={onConfirm}
        onCancel={() => setConfirmOpen(false)}
        destructive
      />
    </form>
  );
}

export const requiredText = z.string().trim().min(1, "필수 항목입니다.");

export const optionalPhone = z
  .string()
  .trim()
  .regex(/^(\d{10,11})?$/, "전화번호는 10~11자리 숫자여야 합니다.");
