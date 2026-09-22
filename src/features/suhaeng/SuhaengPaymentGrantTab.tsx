import { useState, useCallback } from "react";
import { callProxyPost, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { ResultBox, type ResultState } from "../../shared/ui/ResultBox";

interface PaymentInfo {
  hasAccess: boolean;
  isPaid: boolean;
  isTest: boolean;
  amount: number;
  paidAt: string | null;
  validUntil: string | null;
  schoolChange?: string | null;
}

interface GrantResponse {
  isSuccess: boolean;
  systemMessage: string | null;
  created?: boolean;
  orderId?: string;
  payment?: PaymentInfo;
}

export function SuhaengPaymentGrantTab() {
  const [userId, setUserId]       = useState("");
  const [studentId, setStudentId] = useState("");
  const [busy, setBusy]           = useState(false);
  const [result, setResult]       = useState<ResultState | null>(null);
  const [data, setData]           = useState<GrantResponse | null>(null);

  const { logout } = useAuth();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId.trim())   { setResult({ ok: false, message: "user_id를 입력해주세요." }); return; }
      if (!studentId.trim()) { setResult({ ok: false, message: "studentId를 입력해주세요." }); return; }

      setBusy(true);
      setResult(null);
      setData(null);
      try {
        const r = await callProxyPost("/api/payments/test-grant", {
          user_id: userId.trim(),
          studentId: studentId.trim(),
        });

        const json = JSON.parse(r.body) as GrantResponse;
        if (r.ok && json.isSuccess) {
          setData(json);
          setResult({ ok: true, message: json.systemMessage ?? (json.created ? "이용권 발급 완료" : "기존 이용권 반환") });
        } else {
          setResult({ ok: false, message: json.systemMessage ?? `실패 (${r.status})` });
        }
      } catch (e) {
        if (e instanceof UnauthenticatedError) { await logout(); return; }
        setResult({ ok: false, message: `오류: ${e instanceof Error ? e.message : String(e)}` });
      } finally {
        setBusy(false);
      }
    },
    [userId, studentId, logout],
  );

  const p = data?.payment;

  return (
    <div>
      <p className="page-title">테스트 이용권 발급</p>
      <p className="page-subtitle">실제 결제 없이 학생에게 테스트 이용권을 발급합니다.</p>

      <form className="section" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="section-title">이용권 발급</p>

        <div className="field">
          <label htmlFor="pg_user_id">
            user_id (UUID) <span className="required">*</span>
          </label>
          <input
            id="pg_user_id"
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            autoComplete="off"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ fontFamily: "monospace" }}
          />
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#718096" }}>로그인한 회원 ID</p>
        </div>

        <div className="field">
          <label htmlFor="pg_student_id">
            studentId (UUID) <span className="required">*</span>
          </label>
          <input
            id="pg_student_id"
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            autoComplete="off"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            style={{ fontFamily: "monospace" }}
          />
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#718096" }}>해당 회원 소유이고 학교·학년 등록을 마친 학생 ID</p>
        </div>

        <button type="submit" className="btn btn-send" disabled={busy}>
          {busy ? "처리 중..." : "이용권 발급"}
        </button>

        <ResultBox result={result} />
      </form>

      {data && p && (
        <div className="section" style={{ marginTop: 16 }}>
          <p className="section-title">발급 결과</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Row label="신규 발급" value={data.created ? "✅ 새로 발급" : "— 기존 이용권 반환"} />
            {data.orderId && <Row label="orderId" value={data.orderId} mono />}
            <Row label="접근 가능" value={p.hasAccess ? "✅ 예" : "❌ 아니오"} />
            <Row label="결제 여부" value={p.isPaid ? "✅ 결제됨" : "❌ 미결제"} />
            <Row
              label="테스트 이용권"
              value={p.isTest ? "✅ 테스트" : "⚠️ 실결제 이용권"}
              highlight={!p.isTest ? "warn" : undefined}
            />
            <Row label="금액" value={`${p.amount.toLocaleString()}원`} />
            {p.paidAt    && <Row label="결제 시각"  value={p.paidAt} mono />}
            {p.validUntil && <Row label="유효 기간 만료" value={p.validUntil} mono />}
            {p.schoolChange && <Row label="schoolChange" value={p.schoolChange} />}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: "warn" }) {
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: "8px 12px",
      background: highlight === "warn" ? "#fffbeb" : "#f7fafc",
      border: `1px solid ${highlight === "warn" ? "#f6e05e" : "#e2e8f0"}`,
      borderRadius: 6,
    }}>
      <span style={{ minWidth: 130, fontSize: 12, color: "#718096", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1a202c", fontFamily: mono ? "monospace" : undefined, wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}
