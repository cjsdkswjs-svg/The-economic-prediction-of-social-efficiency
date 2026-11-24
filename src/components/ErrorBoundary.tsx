import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || '알 수 없는 오류가 발생했습니다.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen max-w-[800px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-full rounded-2xl border-2 border-[#2A5C46] bg-[#FAFBF7] p-8 shadow-xl">
            <h1 className="text-[28px] font-bold text-slate-900">
              화면 처리 중 문제가 발생했습니다
            </h1>
            <p className="mt-3 text-[19px] text-slate-700">
              잠시 후 다시 시도하거나 처음 화면으로 돌아가 주세요.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.href = '/';
              }}
              className="mt-6 rounded-xl bg-[#185C3E] px-7 py-3.5 text-[20px] font-bold text-white transition-colors hover:bg-[#124730]"
            >
              처음으로 돌아가기
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
