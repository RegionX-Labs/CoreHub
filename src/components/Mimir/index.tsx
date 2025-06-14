
import { inject, isMimirReady, MIMIR_REGEXP } from "@mimirdev/apps-inject";

export async function tryInitMimir() {
  if (typeof window === "undefined") {
    return;
  }

  const openInIframe = window !== window.parent;
  console.log(openInIframe);

  if (!openInIframe) {
    return;
  }

  const origin = await isMimirReady();

  if (!origin) {
    return;
  }

  // check is mimir url
  if (!MIMIR_REGEXP.test(origin)) {
    return;
  }


  // inject to window.injectedWeb3.mimir
  inject();
}
