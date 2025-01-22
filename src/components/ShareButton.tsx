import type { FC } from "react";
import { ShareIcon } from "./icons/ShareIcon";
import { useSettingsStore } from "./store/settings.store.ts";
import { chartsRequestBuilder } from "../lib/request-builder.ts";

interface SharedResponse {
  sharedChartId: string;
}

export const ShareButton: FC = () => {
  const { settings } = useSettingsStore((state) => state);
  const share = async () => {
    if (!settings) {
      return;
    }

    const sharedResponse: SharedResponse = await fetch(
      chartsRequestBuilder(settings, "share"),
      { method: "POST" },
    ).then((res) => res.json());

    const url = `${window.location.origin}?s=${sharedResponse.sharedChartId}`;

    if (navigator.share) {
      await navigator.share({
        title: document.title,
        text: "Check out this chart",
        url,
      });
    } else {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  return (
    <button onClick={share} className="">
      <ShareIcon />
    </button>
  );
};
