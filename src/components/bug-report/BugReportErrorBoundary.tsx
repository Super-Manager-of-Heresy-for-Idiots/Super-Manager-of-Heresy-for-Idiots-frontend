import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { reportReactError } from '@/lib/bugReport';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class BugReportErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportReactError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--stone)] px-4 py-12 text-[var(--ink)]">
          <div className="mx-auto flex max-w-xl flex-col gap-4 border border-[var(--rule)] bg-[var(--panel)] p-6 shadow-[var(--shadow-mid)]">
            <div className="flex items-center gap-3 text-[var(--ink-bright)]">
              <AlertTriangle className="h-5 w-5 text-[var(--ember-pale)]" />
              <h1 className="ao-h5 m-0">Произошла ошибка интерфейса</h1>
            </div>
            <p className="m-0 text-sm text-[var(--ink-quiet)]">
              Можно отправить отчет об ошибке кнопкой в правом нижнем углу.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
