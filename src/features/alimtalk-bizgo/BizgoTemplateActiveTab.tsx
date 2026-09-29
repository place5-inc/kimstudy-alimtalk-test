import { useState, useCallback } from "react";
import { callProxy, callProxyPatch, UnauthenticatedError } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/AuthProvider";
import { useToast } from "../../shared/ui/Toast";

interface BizgoTemplate {
  id?: number;
  templateCode?: string;
  requiredVariables?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
}

export function BizgoTemplateActiveTab() {
  const [templates, setTemplates]               = useState<BizgoTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [pendingCode, setPendingCode]           = useState<string | null>(null);

  const { logout }          = useAuth();
  const { show: showToast } = useToast();

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const r = await callProxy("/admin/bizgo/templates", {});
      const json = JSON.parse(r.body) as { isSuccess: boolean; templates?: BizgoTemplate[] };
      if (json.isSuccess && json.templates) setTemplates(json.templates);
    } catch (e) {
      if (e instanceof UnauthenticatedError) { await logout(); return; }
    } finally {
      setTemplatesLoading(false);
    }
  }, [logout]);

  const toggleActive = useCallback(async (templateCode: string, nextActive: boolean) => {
    setPendingCode(templateCode);
    try {
      const r = await callProxyPatch(`/admin/bizgo/templates/${templateCode}/active`, { isActive: nextActive });
      const json = JSON.parse(r.body) as { isSuccess: boolean; systemMessage: string | null };
      if (r.ok && json.isSuccess) {
        setTemplates((prev) =>
          prev.map((t) => t.templateCode === templateCode ? { ...t, isActive: nextActive } : t)
        );
        showToast(nextActive ? "활성화 완료" : "비활성화 완료");
      } else {
        showToast(json.systemMessage ?? "처리 실패");
      }
    } catch (e) {
      if (e instanceof UnauthenticatedError) { await logout(); return; }
      showToast(`오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPendingCode(null);
    }
  }, [logout, showToast]);

  const activeTemplates   = templates.filter((t) => t.isActive !== false);
  const inactiveTemplates = templates.filter((t) => t.isActive === false);

  return (
    <div>
      <p className="page-title">비즈고 템플릿 활성화</p>
      <p className="page-subtitle">비즈고 알림톡 템플릿의 활성화 여부를 변경합니다.</p>

      <div className="section">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <p className="section-title" style={{ margin: 0 }}>템플릿 목록</p>
          <button
            type="button"
            onClick={() => void loadTemplates()}
            disabled={templatesLoading}
            style={{ padding: "5px 14px", border: "1px solid #bee3f8", borderRadius: 6, background: "#ebf8ff", color: "#2b6cb0", fontSize: 12, cursor: "pointer" }}
          >
            {templatesLoading ? "조회 중..." : "조회하기"}
          </button>
        </div>

        {templates.length === 0 ? (
          <p style={{ fontSize: 13, color: "#a0aec0" }}>조회하기 버튼을 눌러 템플릿 목록을 불러오세요.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...activeTemplates, ...inactiveTemplates].map((t) => {
              const code = t.templateCode ?? "";
              const isActive = t.isActive !== false;
              const isPending = pendingCode === code;
              return (
                <div key={t.id ?? code} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 8,
                  border: `1.5px solid ${isActive ? "#9ae6b4" : "#e2e8f0"}`,
                  background: isActive ? "#f0fff4" : "#f7fafc",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: isActive ? "#276749" : "#a0aec0" }}>
                      {code}
                    </span>
                    {t.description && (
                      <span style={{ marginLeft: 10, fontSize: 12, color: "#718096" }}>— {t.description}</span>
                    )}
                  </div>
                  <span style={{
                    padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: isActive ? "#c6f6d5" : "#edf2f7",
                    color: isActive ? "#276749" : "#718096",
                  }}>
                    {isActive ? "활성" : "비활성"}
                  </span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void toggleActive(code, !isActive)}
                    style={{
                      padding: "5px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                      border: `1px solid ${isActive ? "#fed7d7" : "#9ae6b4"}`,
                      background: isActive ? "#fff5f5" : "#f0fff4",
                      color: isActive ? "#c53030" : "#276749",
                      fontWeight: 600,
                    }}
                  >
                    {isPending ? "처리 중..." : isActive ? "비활성화" : "활성화"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
