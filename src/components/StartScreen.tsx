import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, Factory, Lock, Volume2, VolumeX } from 'lucide-react';
import { CONFIG, type RoleType } from '../simulation/engine';
import {
  STUDENT_ID_MAX_LEN,
  STUDENT_INPUT_PATTERN,
  STUDENT_NAME_MAX_LEN,
} from '../firebase';

interface StartScreenProps {
  studentId: string;
  studentName: string;
  selectedRole: RoleType;
  muted: boolean;
  onChangeStudentId: (val: string) => void;
  onChangeStudentName: (val: string) => void;
  onSelectRole: (role: RoleType) => void;
  onToggleMute: () => void;
  onStart: () => void;
  onOpenAdmin: () => void;
}

export function StartScreen({
  studentId,
  studentName,
  selectedRole,
  muted,
  onChangeStudentId,
  onChangeStudentName,
  onSelectRole,
  onToggleMute,
  onStart,
  onOpenAdmin,
}: StartScreenProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const introText =
    selectedRole === 'worker' ? CONFIG.copy.workerStartIntro : CONFIG.copy.startIntro;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedId = studentId.trim();
    const trimmedName = studentName.trim();

    if (!trimmedId) {
      setFormError('학번을 입력해 주세요. (예: 10315)');
      return;
    }
    if (!STUDENT_INPUT_PATTERN.test(trimmedId)) {
      setFormError('학번은 한글, 영문, 숫자, -, _만 최대 20자까지 입력할 수 있습니다.');
      return;
    }
    if (!trimmedName) {
      setFormError('이름을 입력해 주세요. (예: 김한빛)');
      return;
    }
    if (!STUDENT_INPUT_PATTERN.test(trimmedName)) {
      setFormError('이름은 한글, 영문, 숫자, -, _만 최대 20자까지 입력할 수 있습니다.');
      return;
    }

    setFormError(null);
    onStart();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col justify-center gap-3 px-6 py-5">
      <div className="grid grid-cols-1 items-stretch gap-7 rounded-2xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-6 shadow-xl lg:grid-cols-12 lg:p-8">
        {/* 좌측: 제목, 학번·이름 입력, 역할 선택, 시작 버튼 */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col justify-between gap-4 lg:col-span-6"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[16px] font-bold text-[#1B5E42]">
                지역 산업단지 · 직원 100명 · 7턴 역할극 시뮬레이션
              </p>
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? '배경음·효과음 켜기' : '배경음·효과음 끄기'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C6DDD0] bg-white px-3 py-1.5 text-[15px] font-semibold text-slate-700 transition-colors hover:bg-[#EEF5F0] whitespace-nowrap shrink-0"
              >
                {muted ? (
                  <>
                    <VolumeX className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    <span>음악·효과음 꺼짐</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 text-[#185C3E]" aria-hidden="true" />
                    <span>음악·효과음 켜짐</span>
                  </>
                )}
              </button>
            </div>

            <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-tight text-slate-900 [text-wrap:balance] lg:text-[36px]">
              {CONFIG.copy.appTitle}
            </h1>
            <p className="mt-2.5 text-[20px] font-normal leading-relaxed text-slate-800">
              {introText}
            </p>
          </div>

          {/* 1단계: 학번 & 이름 입력 */}
          <div className="rounded-xl border border-[#C6DDD0] bg-white p-3.5">
            <p className="mb-2 text-[16px] font-bold text-[#1B5E42]">
              1단계 · 학번과 이름을 입력하세요
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="student-id"
                  className="block text-[15px] font-bold text-slate-800"
                >
                  학번
                </label>
                <input
                  id="student-id"
                  type="text"
                  value={studentId}
                  maxLength={STUDENT_ID_MAX_LEN}
                  placeholder="예: 10315"
                  onChange={(e) => {
                    onChangeStudentId(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="mt-1 w-full rounded-lg border-2 border-[#C6DDD0] bg-[#FAFBF7] px-3.5 py-2 text-[19px] font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#185C3E] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="student-name"
                  className="block text-[15px] font-bold text-slate-800"
                >
                  이름
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={studentName}
                  maxLength={STUDENT_NAME_MAX_LEN}
                  placeholder="예: 김한빛"
                  onChange={(e) => {
                    onChangeStudentName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="mt-1 w-full rounded-lg border-2 border-[#C6DDD0] bg-[#FAFBF7] px-3.5 py-2 text-[19px] font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#185C3E] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
            {formError && (
              <p
                role="alert"
                data-testid="start-form-error"
                className="mt-2 text-[15px] font-bold text-rose-700"
              >
                {formError}
              </p>
            )}
          </div>

          {/* 2단계: 역할 선택 */}
          <div>
            <p className="mb-2 text-[16px] font-bold text-[#1B5E42]">
              2단계 · 체험할 캐릭터 역할을 고르세요
            </p>
            <div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              role="radiogroup"
              aria-label="캐릭터 역할 선택"
            >
              {CONFIG.roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`role-btn-${role.id}`}
                    onClick={() => onSelectRole(role.id)}
                    className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors duration-75 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                      isSelected
                        ? 'border-[#185C3E] bg-[#E8F4ED] shadow-xs'
                        : 'border-[#C6DDD0] bg-white hover:border-[#185C3E] hover:bg-[#F3F9F5]'
                    }`}
                  >
                    <img
                      src={role.image}
                      alt={role.title}
                      referrerPolicy="no-referrer"
                      className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[19px] font-bold text-slate-900">
                          {role.id === 'ceo' ? '기업가' : '노동자'}
                        </span>
                        {isSelected && (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#185C3E] text-white">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[14px] font-semibold text-[#1B5E42]">
                        {role.id === 'ceo' ? '한빛정밀 대표' : '현장 숙련 기술자'}
                      </p>
                      <p className="mt-0.5 text-[14px] leading-snug text-slate-700">
                        {role.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              data-start="true"
              className="inline-flex items-center gap-3 rounded-xl bg-[#185C3E] px-8 py-3.5 text-[22px] font-bold text-white shadow-sm transition-colors hover:bg-[#124730] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 whitespace-nowrap shrink-0"
            >
              <span>{CONFIG.copy.startButton}</span>
              <ArrowRight className="h-6 w-6" aria-hidden="true" />
            </button>
            <span className="text-[17px] font-medium text-slate-600">
              단 한 번의 7턴 도전 · 결과 순위 등록
            </span>
          </div>
        </form>

        {/* 우측: 한빛정밀 현장 일러스트 & 핵심 탐구 질문 */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-6">
          <div className="relative flex-1 overflow-hidden rounded-xl border border-[#C6DDD0] bg-slate-100 min-h-[280px]">
            {!imgFailed ? (
              <img
                src="/src/assets/images/hero_hanbit_factory_1795512227833.jpg"
                alt="협동 로봇과 엔지니어가 함께 정밀 부품을 검사하는 한빛정밀 제조 현장"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-50 to-slate-100 p-6 text-slate-600">
                <Factory className="h-14 w-14 text-[#185C3E]" aria-hidden="true" />
                <span className="text-[20px] font-semibold text-slate-800">한빛정밀 제조 현장</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#C6DDD0] bg-[#EEF5F0] px-5 py-4">
            <p className="text-[15px] font-bold text-[#1B5E42]">핵심 탐구 질문</p>
            <p className="mt-1 text-[20px] font-bold text-slate-900">
              {CONFIG.copy.inquiryPrompt}
            </p>
          </div>
        </div>
      </div>

      {/* 하단 안내 + 부스 운영자 전용 공간 버튼 */}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-[14px] text-emerald-100/80">{CONFIG.copy.disclaimer}</p>
        <button
          type="button"
          data-testid="open-admin-btn"
          onClick={onOpenAdmin}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B735A] bg-[#19402F] px-3.5 py-1.5 text-[14px] font-semibold text-emerald-100 transition-colors hover:bg-[#235740] whitespace-nowrap shrink-0"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>관리자 결과 비교</span>
        </button>
      </footer>
    </main>
  );
}
