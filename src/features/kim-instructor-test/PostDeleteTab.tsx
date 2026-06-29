import { z } from 'zod';
import { ActionForm, requiredText } from '../../shared/ui/ActionForm';

const schema = z.object({ jobOfferId: requiredText });

export function PostDeleteTab() {
  return (
    <div>
      <p className="page-title">공고 삭제</p>

      <ActionForm
        title="🗑️ 공고 삭제"
        buttonLabel="삭제"
        variant="done"
        schema={schema}
        backendPath="/admin/academy/consulting/delete/kimacademy/jobOffer"
        buildParams={(v) => ({ jobOfferId: v.jobOfferId })}
        action="kimInstructor:postDelete"
        dangerous={false}
      >
        {({ register }) => (
          <div className="field">
            <label htmlFor="post_jobOfferId">
              jobOfferId <span className="required">*</span>
            </label>
            <input
              id="post_jobOfferId"
              type="text"
              placeholder="jobOfferId 입력"
              autoComplete="off"
              {...register('jobOfferId')}
            />
          </div>
        )}
      </ActionForm>
    </div>
  );
}
