import { useState } from "react";
import { z } from "zod";
import { ActionForm, requiredText } from "../../shared/ui/ActionForm";

const TYPE_OPTIONS = [
  {
    value: "request_closed_reselect",
    label: "A",
    description:
      "모집중인 공고에 삭제대상 과목(영유레테)만 있는 경우 → 공고는 마감처리, 삭제대상 과목은 유지",
  },
  {
    value: "request_reopen_reselect",
    label: "C",
    description:
      "마감된 공고에 삭제대상 과목(영유레테)만 있는 경우 → 마감 유지, 삭제대상 과목도 유지",
  },
  {
    value: "request_reopen_partial",
    label: "D",
    description:
      "마감된 공고에 삭제대상 과목(영유레테)과 다른 과목이 함께 있는 경우 → 마감 유지, 삭제대상 과목은 지우고 다른 과목 유지",
  },
] as const;

const schema = z.object({
  requestId: requiredText,
  type: requiredText,
});

export function AcademyLawPopupTab() {
  const [selectedType, setSelectedType] = useState<string>("");

  return (
    <div>
      <p className="page-title">학원법 팝업 관련 세팅</p>

      {/* 삭제 대상 안내 */}
      <div
        className="section"
        style={{
          background: "rgba(255,200,0,0.08)",
          borderLeft: "4px solid #d69e2e",
          marginBottom: 0,
        }}
      >
        <p className="section-title" style={{ color: "#b7791f" }}>
          📌 삭제 대상 과목 안내
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          이 API에서 말하는 <strong>삭제 대상 과목</strong>은{" "}
          <strong>영유레테</strong>로 한정됩니다.
        </p>
      </div>

      {/* API 실행 결과 설명 */}
      <div
        className="section"
        style={{
          background: "rgba(49,130,206,0.06)",
          borderLeft: "4px solid #3182ce",
          marginBottom: 0,
        }}
      >
        <p className="section-title" style={{ color: "#2b6cb0" }}>
          ℹ️ 이 API를 실행하면 어떻게 되나요?
        </p>
        <ol
          style={{ fontSize: 13, lineHeight: 1.9, margin: 0, paddingLeft: 18 }}
        >
          <li>
            입력한 모집공고를 <strong>마감처리</strong>하고, 이 공고에 있던{" "}
            <strong>과목을 모두 삭제</strong>합니다.
          </li>
          <li>
            그 다음, 선택한 타입에 따라 아래와 같이 처리합니다.
            <ul style={{ paddingLeft: 18, marginTop: 4 }}>
              <li>
                <strong>A, C 타입:</strong> 영유레테 과목만 과목으로 다시
                설정합니다.
              </li>
              <li>
                <strong>D 타입:</strong> 영유레테 과목은 삭제하고, 임의 과목
                2개를 추가한 상태로 만듭니다.
              </li>
            </ul>
          </li>
          <li>
            이 API 실행에 따른 팝업은 어디서 확인할 수 있나요?
            <ul style={{ paddingLeft: 18, marginTop: 4 }}>
              <li>
                <strong>A 타입:</strong> 홈화면에서 팝업이 노출됩니다. 나타나지
                않는다면 Ctrl + Shift + R로 새로고침 후 확인해보세요.
              </li>
              <li>
                <strong>C, D 타입:</strong> 마감된 모집공고를 수정하려 할 때,
                팝업이 노출됩니다.
              </li>
            </ul>
          </li>
        </ol>
      </div>

      <ActionForm
        title="⚙️ 학원법 팝업 세팅 실행"
        buttonLabel="실행"
        variant="send"
        schema={schema}
        backendPath="/admin/test/academy/request/set"
        buildParams={(v) => ({ requestId: v.requestId, type: v.type })}
        action="patch2607:academyLawPopup"
        dangerous={false}
      >
        {({ register, setField }) => (
          <>
            <div className="field">
              <label htmlFor="academy_law_request_id">
                모집공고 ID <span className="required">*</span>
              </label>
              <input
                id="academy_law_request_id"
                type="text"
                placeholder="예) 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                autoComplete="off"
                {...register("requestId")}
              />
              <p className="hint">
                웹 모집공고 상세 페이지 URL에서 확인할 수 있는 GUID 값입니다.
              </p>
            </div>

            <div className="field">
              <label>
                타입 선택 <span className="required">*</span>
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `2px solid ${selectedType === opt.value ? "#3182ce" : "#e2e8f0"}`,
                      background:
                        selectedType === opt.value
                          ? "rgba(49,130,206,0.06)"
                          : "transparent",
                      cursor: "pointer",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    <input
                      type="radio"
                      name="academy_law_type"
                      value={opt.value}
                      checked={selectedType === opt.value}
                      onChange={() => {
                        setSelectedType(opt.value);
                        setField("type", opt.value);
                      }}
                      style={{ marginTop: 3, flexShrink: 0 }}
                    />
                    <span>
                      <strong style={{ marginRight: 6 }}>{opt.label}</strong>
                      <code
                        style={{
                          fontSize: 11,
                          background: "rgba(0,0,0,0.07)",
                          padding: "1px 5px",
                          borderRadius: 4,
                        }}
                      >
                        {opt.value}
                      </code>
                      <br />
                      <span style={{ color: "#4a5568" }}>
                        {opt.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {/* register("type")로 hidden input 연동 */}
              <input type="hidden" {...register("type")} />
            </div>
          </>
        )}
      </ActionForm>
    </div>
  );
}
