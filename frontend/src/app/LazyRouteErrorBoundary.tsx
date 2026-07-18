import { Component, type ReactNode } from "react";

type LazyRouteErrorBoundaryProps = {
  children: ReactNode;
  onRetry?: () => void;
};

type LazyRouteErrorBoundaryState = {
  hasError: boolean;
};

export class LazyRouteErrorBoundary extends Component<
  LazyRouteErrorBoundaryProps,
  LazyRouteErrorBoundaryState
> {
  state: LazyRouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LazyRouteErrorBoundaryState {
    return { hasError: true };
  }

  private retry = () => {
    if (this.props.onRetry) {
      this.props.onRetry();
      return;
    }

    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        role="alert"
        aria-labelledby="lazy-route-error-title"
        className="flex min-h-screen items-center justify-center bg-mist px-6 text-cacao"
      >
        <div className="max-w-md text-center">
          <h1
            id="lazy-route-error-title"
            className="font-display text-3xl font-semibold text-espresso"
          >
            Não foi possível carregar esta área
          </h1>
          <p className="mt-3 leading-7 text-cacao/75">
            Verifique sua conexão e tente carregar o portal novamente.
          </p>
          <button
            type="button"
            onClick={this.retry}
            className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-espresso px-6 text-sm font-semibold text-ivory outline-none transition-colors hover:bg-cacao focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }
}
