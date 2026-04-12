interface RegisterAppServiceWorkerOptions {
  onUpdateAvailable?: () => void;
}

export interface AppServiceWorkerController {
  applyUpdate: () => Promise<void>;
}

let reloadTriggered = false;

function createNoopController(): AppServiceWorkerController {
  return {
    async applyUpdate() {
      return;
    }
  };
}

function getWaitingWorker(registration: ServiceWorkerRegistration): ServiceWorker | null {
  return registration.waiting;
}

export async function registerAppServiceWorker(
  options: RegisterAppServiceWorkerOptions = {}
): Promise<AppServiceWorkerController> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return createNoopController();
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

    if (registration.waiting) {
      options.onUpdateAvailable?.();
    }

    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;

      if (!installingWorker) {
        return;
      }

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state !== 'installed') {
          return;
        }

        if (navigator.serviceWorker.controller) {
          options.onUpdateAvailable?.();
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadTriggered) {
        return;
      }

      reloadTriggered = true;
      window.location.reload();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void registration.update();
    });

    return {
      async applyUpdate() {
        const existingWaitingWorker = getWaitingWorker(registration);

        if (existingWaitingWorker) {
          existingWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
          return;
        }

        await registration.update();

        const updatedWaitingWorker = getWaitingWorker(registration);

        if (updatedWaitingWorker) {
          updatedWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    };
  } catch (error) {
    console.error('Unable to register service worker', error);
    return createNoopController();
  }
}
