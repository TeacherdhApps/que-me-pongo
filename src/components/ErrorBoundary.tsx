import { Component, type ErrorInfo, type ReactNode } from 'react';
import { translations, type Locale } from '../i18n/translations';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  locale: Locale;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    locale: (localStorage.getItem('qmp-locale') as Locale) || 'es'
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      locale: (localStorage.getItem('qmp-locale') as Locale) || 'es'
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private t(key: keyof typeof translations.es): string {
    const { locale } = this.state;
    return translations[locale][key] || translations.es[key] || key;
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 animate-fade">
          <div className="bg-white border border-zinc-100 shadow-2xl rounded-[3rem] p-10 md:p-16 w-full max-w-2xl text-center space-y-10">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <i className="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                {this.t('error.title')}
              </h1>
              <p className="text-zinc-400 text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                {this.t('error.description')}
              </p>
            </div>

            {this.state.error && (
              <div className="bg-zinc-50 rounded-3xl p-6 text-left border border-zinc-100 overflow-hidden">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mb-2">{this.t('error.details')}</p>
                <code className="text-[10px] text-red-500 font-mono break-all line-clamp-3">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-5 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
            >
              {this.t('error.reload')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
