import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by Fertiva ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAF8] flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Instabilidade Temporária Recuperada
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                O Fertiva identificou uma oscilação na renderização da tela. Nenhum dado cadastrado foi perdido.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-left font-mono text-[10px] text-gray-600 max-h-28 overflow-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8BC34A]" />
                <span>Recarregar Tela</span>
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = window.location.pathname;
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Início</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
